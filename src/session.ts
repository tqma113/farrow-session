import { CookieData, Cookie, createCookie } from './cookie'
import { Store } from './store'

export type SessionData = {
  id: string,
  cookie: CookieData,
}

export type Session = SessionData & {
  cookie: Cookie,
  destroy: () => void
  reload: () => void
  save: () => void
  touch: () => void
}

export const implSession = (
  sessionData: SessionData,
  store: Store,
): Session => {
  const originalMaxAge = sessionData.cookie.originalMaxAge

  const cookie = createCookie(sessionData.cookie);

  // keep originalMaxAge intact
  cookie.originalMaxAge = originalMaxAge

  const session = createSession(sessionData.id, cookie, store);

  return session;
}

export const createSession = (
  id: string,
  cookie: Cookie,
  store: Store
): Readonly<Session> => {
  const destroy = () => {
    store.destroy(id)
    return session
  }

  const reload = () => {
    const sessionData = store.get(id)

    if (sessionData) {
      implSession(sessionData, store)
    }
    
    return session
  }

  const save = () => {
    store.set(id, session)
    return session
  }

  const touch = () => {
    cookie.maxAge = cookie.originalMaxAge
    return session
  }

  const session = {
    id,
    cookie,
    destroy,
    reload,
    save,
    touch
  }

  return session
}