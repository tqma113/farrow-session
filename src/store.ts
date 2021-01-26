import { EventEmitter } from 'events'
import { Session, SessionData } from './session'

export interface Store extends EventEmitter {
  get: (sid: string) => SessionData | false
  set: (sid: string, session: Session) => void
  touch: (sid: string, session: Session) => void
  destroy: (sid: string) => void
  clear: () => void
  length: () => number
}

export const createMemoryStore = (): Store => {
  let sessions: Record<string, string> = Object.create(null)
  const emitter = new EventEmitter()

  const get = (sid: string): SessionData | false => {
    const sessionDataStr = sessions[sid]

    if (!sessionDataStr) {
      return false
    }

    try {
      const sessionData = JSON.parse(sessionDataStr)

      if (sessionData.cookie) {
        const expires = typeof sessionData.cookie.expires === 'string'
          ? new Date(sessionData.cookie.expires)
          : sessionData.cookie.expires
        
        // destroy expired session
        if (expires && expires <= Date.now()) {
          destroy(sid)
          return false
        }
      }

      return sessionData
    } catch {
      destroy(sid)
      return false
    }
  }

  const set = (sid: string, session: SessionData) => {
    sessions[sid] = JSON.stringify(session)
  }

  const touch = (sid: string, session: Session) => {
    const currentSession = get(sid)
    if (currentSession) {
      currentSession.cookie = session.cookie
      set(sid, currentSession)
    }
  }

  const destroy = (sid: string) => {
    delete sessions[sid]
  }

  const clear = () => {
    sessions = Object.create(null)
  }

  const length = () => {
    return Object.keys(sessions).length
  }

  return Object.assign(emitter, { length, get, set, touch, destroy, clear })
}
