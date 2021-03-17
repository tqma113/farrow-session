import { createContext } from 'farrow-pipeline'
import { HttpMiddleware, Response, useReq } from 'farrow-http'
import invariant from 'tiny-invariant'
import warning from 'tiny-warning'
import { v4 as uuid } from 'uuid'

import { CookieOptions, createCookie } from './cookie'
import { Session, createSession, implSession, SessionData } from './session'
import { Store, createMemoryStore } from './store'
import { signCookie, unsignCookie } from './sign'

// Function to call to generate a new session ID. Provide a function that
// returns a string that will be used as a session ID. The function is given
// req as the first argument if you want to use some value attached to req when
// generating the ID.
// The default value is a function which uses the uuid library to generate IDs.
//
// Note: be careful to generate unique IDs so your sessions do not conflict.
export type GenID = () => string

export type Options = {
  cookie?: CookieOptions
  genid?: GenID
  name?: string
  secret: string
  store?: Store
  proxy?: boolean
}

export type StoreState = 'Woring' | 'Disconnect' | 'Block'
export type StoreBlockResolver = (state: StoreState) => void

const DEFAULT_NAME = 'connect.sid'

const generateSessionId = () => {
  return uuid()
}

export const createSessionContext = (options: Options) => {
  const secret = options.secret
  const name = options.name || DEFAULT_NAME
  const cookieOptions: CookieOptions = options.cookie || {}
  const generateId: GenID = options.genid || generateSessionId
  const proxy = typeof options.proxy === 'boolean' ? options.proxy : true

  const store = options.store || createMemoryStore()

  invariant(!!secret, 'secret is required')

  invariant(
    !Array.isArray(secret) || secret.length !== 0,
    'secret option array must contain one or more strings'
  )

  let storeState: StoreState = 'Woring'
  let blockResolvers: StoreBlockResolver[] = []
  store.on('work', () => {
    storeState = 'Woring'
    runStoreResolvers('Woring')
  })
  store.on('disconnect', () => {
    storeState = 'Disconnect'
    runStoreResolvers('Disconnect')
  })
  store.on('block', () => {
    storeState = 'Block'
  })

  const runStoreResolvers = (state: StoreState) => {
    Promise.resolve().then(() =>
      blockResolvers.forEach((resolve) => resolve(state))
    )
  }

  const waitStoreDisblock = () => {
    return new Promise<StoreState>((resolve) => {
      blockResolvers.push(resolve)
    })
  }

  const sessionContext = createContext<Session | null>(null)

  const set = (sessionData: SessionData) => {
    const session = implSession(sessionData, store)

    sessionContext.set(session)

    return session
  }

  const generate = async () => {
    const sid = generateId()
    const cookie = createCookie(cookieOptions)
    const session = createSession(sid, cookie, store)

    sessionContext.set(session)

    return session
  }

  const destory = () => {
    const session = sessionContext.get()

    if (session !== null) {
      store.destroy(session.id)
      sessionContext.set(null)
    }

    return session
  }

  const refresh = () => {
    destory()
    generate()
  }

  const touch = () => {
    const session = sessionContext.get()

    if (session !== null) {
      session.touch()
    }

    return session
  }

  const provider = (): HttpMiddleware => {
    const isSecure = () => {
      const req = useReq()

      // socket is tls.TLSSocket of https server
      // @ts-ignore
      if (req.socket.encrypted) {
        return true
      }

      if (!proxy) {
        return false
      }

      const header = (req.headers['x-forwarded-proto'] as string) || ''
      const index = header.indexOf(',')
      const proto =
        index !== -1
          ? header.substr(0, index).toLowerCase().trim()
          : header.toLowerCase().trim()

      return proto === 'https'
    }

    const setCookie = (): Response => {
      const session = sessionContext.get()

      if (session && (!session.cookie.secure || isSecure())) {
        const signed = signCookie(session.id, secret)
        return Response.cookie(name, signed, session.cookie.data)
      }

      return Response
    }

    const save = async (): Promise<Response> => {
      const session = sessionContext.get()

      if (session) {
        session.save()
      }

      return setCookie()
    }

    return async (request, next) => {
      // self-awareness
      if (sessionContext.get()) {
        return next()
      }

      // Handle connection as if there is no session if
      // the store has temporarily disconnected etc
      switch (storeState) {
        case 'Block': {
          // wait for store disblock
          if ('Woring' === (await waitStoreDisblock())) {
            break
          }
        }
        case 'Disconnect': {
          warning(false, 'store is disconnected')
          return next()
        }
        // default StoreState.Working
      }

      // pathname mismatch TODO: If is this useful?
      if (request.pathname.indexOf(cookieOptions.path || '/') !== 0) {
        return next()
      }

      const sid =
        !!request.cookies &&
        !!request.cookies[name] &&
        unsignCookie(request.cookies[name], secret)

      if (sid) {
        const sessionData = store.get(sid)

        if (!!sessionData) {
          set(sessionData)
        } else {
          await generate()
        }
      } else {
        await generate()
      }

      // `save` should exec after `next`, and Response.merge is order-sensitive
      const nextRes = await next()
      const saveRes = await save()
      return Response.merge(saveRes, nextRes)
    }
  }

  return {
    get id() {
      const session = sessionContext.get()
      return session ? session.id : null
    },
    get cookie() {
      const session = sessionContext.get()
      return session ? session.cookie : null
    },
    generate,
    destory,
    refresh,
    touch,
    store,
    provider,
  }
}
