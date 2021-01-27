import { Response, createRouterPipeline } from 'farrow-http'
import { createContainer } from 'farrow-pipeline'

import { createSessionContext } from '../src'

import { unsignCookie, signCookie } from '../src/sign'

import { sleep } from './util'

describe('session', () => {
  it('should do nothing if context has been inited', async () => {
    const pipeline = createRouterPipeline()
    const Session = createSessionContext({
      secret: 'farrow',
    })

    pipeline.use((req, next) => {
      Session.generate()
      return next()
    })
    pipeline.use(Session.provider())
    pipeline.use(() => {
      return Response
    })

    const result = await pipeline.run(
      {
        pathname: '/foo',
      },
      {
        container: createContainer(),
      }
    )
    expect(result.info.cookies).toBeUndefined()
  })

  it('should generate a new session', async () => {
    const pipeline = createRouterPipeline()
    const Session = createSessionContext({
      secret: 'farrow',
      name: 'session.id',
    })

    pipeline.use(Session.provider())
    pipeline.use(() => {
      return Response
    })

    const result = await pipeline.run(
      {
        pathname: '/foo',
      },
      {
        container: createContainer(),
      }
    )
    expect(result.info.cookies).toBeDefined()
    if (result.info.cookies) {
      expect(result.info.cookies['session.id']).toBeDefined()
    }
  })

  it('should load session from cookie session.id', async () => {
    const pipeline = createRouterPipeline()
    const Session = createSessionContext({
      secret: 'farrow',
      name: 'session.id',
    })

    pipeline.use(Session.provider())
    pipeline.use(() => {
      return Response
    })

    const result = await pipeline.run(
      {
        pathname: '/foo',
      },
      {
        container: createContainer(),
      }
    )
    expect(result.info.cookies).toBeDefined()

    if (result.info.cookies) {
      expect(result.info.cookies['session.id']).toBeDefined()

      const cookie = result.info.cookies['session.id'].value
      const result1 = await pipeline.run(
        {
          pathname: '/bar',
          cookies: {
            'session.id': cookie,
          },
        },
        {
          container: createContainer(),
        }
      )
      expect(result1.info.cookies).toBeDefined()
      if (result1.info.cookies) {
        expect(result1.info.cookies['session.id']).toBeDefined()
        expect(result1.info.cookies['session.id'].value).toBe(cookie)
      }
    }
  })

  it('should create multiple sessions', async () => {
    const pipeline = createRouterPipeline()
    const Session = createSessionContext({
      secret: 'farrow',
      name: 'session.id',
    })

    pipeline.use(Session.provider())
    pipeline.use(() => {
      return Response
    })

    const result0 = await pipeline.run(
      {
        pathname: '/foo',
      },
      {
        container: createContainer(),
      }
    )
    expect(result0.info.cookies).toBeDefined()
    if (result0.info.cookies) {
      expect(result0.info.cookies['session.id']).toBeDefined()
      if (result0.info.cookies['session.id']) {
        const result1 = await pipeline.run(
          {
            pathname: '/bar',
          },
          {
            container: createContainer(),
          }
        )
        expect(result1.info.cookies).toBeDefined()

        if (result1.info.cookies) {
          expect(result1.info.cookies['session.id']).toBeDefined()

          expect(result0.info.cookies['session.id'].value).not.toBe(
            result1.info.cookies['session.id'].value
          )
        }
      }
    }
  })

  it('should have saved session with updated cookie expiration', async () => {
    const pipeline = createRouterPipeline()
    const Session = createSessionContext({
      secret: 'farrow',
      name: 'session.id',
      cookie: {
        maxAge: 5000,
      },
    })

    pipeline.use(Session.provider())
    pipeline.use(() => {
      return Response
    })

    const result = await pipeline.run(
      {
        pathname: '/foo',
      },
      {
        container: createContainer(),
      }
    )
    expect(result.info.cookies).toBeDefined()

    if (result.info.cookies) {
      expect(result.info.cookies['session.id']).toBeDefined()

      await sleep(3000)

      const cookie = result.info.cookies['session.id'].value
      const result1 = await pipeline.run(
        {
          pathname: '/bar',
          cookies: {
            'session.id': cookie,
          },
        },
        {
          container: createContainer(),
        }
      )
      expect(result1.info.cookies).toBeDefined()
      if (result1.info.cookies) {
        expect(result1.info.cookies['session.id']).toBeDefined()
        expect(result1.info.cookies['session.id'].value).toBe(cookie)
        expect(result1.info.cookies['session.id'].options.expires).not.toBe(
          result.info.cookies['session.id'].options.expires
        )
        expect(
          result1.info.cookies['session.id'].options.expires.getTime() -
            Date.now()
        ).toBeGreaterThan(3000)
      }
    }
  })

  describe('when sid not in store', () => {
    it('should create a new session', async () => {
      const pipeline = createRouterPipeline()
      const Session = createSessionContext({
        secret: 'farrow',
        name: 'session.id',
      })

      pipeline.use(Session.provider())
      pipeline.use(() => {
        return Response
      })

      const result = await pipeline.run(
        {
          pathname: '/foo',
        },
        {
          container: createContainer(),
        }
      )
      expect(result.info.cookies).toBeDefined()
      if (result.info.cookies) {
        expect(result.info.cookies['session.id']).toBeDefined()

        Session.store.clear()

        const cookie = result.info.cookies['session.id'].value
        const result1 = await pipeline.run(
          {
            pathname: '/bar',
            cookies: {
              'session.id': cookie,
            },
          },
          {
            container: createContainer(),
          }
        )
        expect(result1.info.cookies).toBeDefined()
        if (result1.info.cookies) {
          expect(result1.info.cookies['session.id']).toBeDefined()
          expect(result1.info.cookies['session.id'].value).not.toBe(cookie)
        }
      }
    })
  })

  describe('when sid not properly signed', () => {
    it('should generate new session', async () => {
      const pipeline = createRouterPipeline()
      const Session = createSessionContext({
        secret: 'farrow',
        name: 'session.id',
      })

      pipeline.use(Session.provider())
      pipeline.use(() => {
        return Response
      })

      const result = await pipeline.run(
        {
          pathname: '/foo',
        },
        {
          container: createContainer(),
        }
      )
      expect(result.info.cookies).toBeDefined()
      if (result.info.cookies) {
        expect(result.info.cookies['session.id']).toBeDefined()

        Session.store.clear()

        const cookie = result.info.cookies['session.id'].value
        expect(typeof cookie).toBe('string')
        if (typeof cookie === 'string') {
          const result1 = await pipeline.run(
            {
              pathname: '/bar',
              cookies: {
                'session.id': cookie.slice(2),
              },
            },
            {
              container: createContainer(),
            }
          )
          expect(result1.info.cookies).toBeDefined()
          if (result1.info.cookies) {
            expect(result1.info.cookies['session.id']).toBeDefined()
            expect(result1.info.cookies['session.id'].value).not.toBe(cookie)
          }
        }
      }
    })
  })

  describe('when session expired in store', () => {
    it('should create a new session', async () => {
      const pipeline = createRouterPipeline()
      const Session = createSessionContext({
        secret: 'farrow',
        name: 'session.id',
        cookie: {
          maxAge: 500,
        },
      })

      pipeline.use(Session.provider())
      pipeline.use(() => {
        return Response
      })

      const result = await pipeline.run(
        {
          pathname: '/foo',
        },
        {
          container: createContainer(),
        }
      )
      expect(result.info.cookies).toBeDefined()
      if (result.info.cookies) {
        expect(result.info.cookies['session.id']).toBeDefined()

        await sleep(1000)

        const cookie = result.info.cookies['session.id'].value
        const result1 = await pipeline.run(
          {
            pathname: '/bar',
            cookies: {
              'session.id': cookie,
            },
          },
          {
            container: createContainer(),
          }
        )
        expect(result1.info.cookies).toBeDefined()
        if (result1.info.cookies) {
          expect(result1.info.cookies['session.id']).toBeDefined()
          expect(result1.info.cookies['session.id'].value).not.toBe(cookie)
        }
      }
    })

    it('should not exist in store', async () => {
      const pipeline = createRouterPipeline()
      const Session = createSessionContext({
        secret: 'farrow',
        name: 'session.id',
        cookie: {
          maxAge: 500,
        },
      })

      pipeline.use(Session.provider())
      pipeline.use(() => {
        return Response
      })

      const result = await pipeline.run(
        {
          pathname: '/foo',
        },
        {
          container: createContainer(),
        }
      )
      expect(result.info.cookies).toBeDefined()
      if (result.info.cookies) {
        expect(result.info.cookies['session.id']).toBeDefined()

        await sleep(1000)

        const cookie = result.info.cookies['session.id'].value
        const result1 = await pipeline.run(
          {
            pathname: '/bar',
            cookies: {
              'session.id': cookie,
            },
          },
          {
            container: createContainer(),
          }
        )
        expect(result1.info.cookies).toBeDefined()
        if (result1.info.cookies) {
          expect(result1.info.cookies['session.id']).toBeDefined()
          expect(result1.info.cookies['session.id'].value).not.toBe(cookie)

          const sid = unsignCookie(cookie as string, 'farrow')
          expect(sid).not.toBe(false)
          if (sid) {
            const sessionData = Session.store.get(sid)
            expect(sessionData).toBe(false)
          }
        }
      }
    })
  })

  describe('options', () => {
    it('name', async () => {
      const name = 'session.id'
      const pipeline = createRouterPipeline()
      const Session = createSessionContext({
        secret: 'farrow',
        name,
      })

      pipeline.use(Session.provider())
      pipeline.use(() => {
        return Response
      })

      const result = await pipeline.run(
        {
          pathname: '/foo',
        },
        {
          container: createContainer(),
        }
      )
      expect(result.info.cookies).toBeDefined()
      if (result.info.cookies) {
        expect(result.info.cookies[name]).toBeDefined()
      }
    })

    it('genid', async () => {
      const pipeline = createRouterPipeline()
      const Session = createSessionContext({
        secret: 'farrow',
        name: 'session.id',
        genid: () => 'foo',
      })

      pipeline.use((req, next) => {
        return next()
      })
      pipeline.use(Session.provider())
      pipeline.use(() => {
        return Response
      })

      const result = await pipeline.run(
        {
          pathname: '/foo',
        },
        {
          container: createContainer(),
        }
      )
      expect(result.info.cookies).toBeDefined()
      if (result.info.cookies) {
        expect(result.info.cookies['session.id'].value).toBe(
          signCookie('foo', 'farrow')
        )
      }
    })
  })

  describe('store state', () => {
    it('should not be set if store is disconnected', async () => {
      const pipeline = createRouterPipeline()
      const Session = createSessionContext({
        secret: 'farrow',
      })

      Session.store.emit('disconnect')

      pipeline.use(Session.provider())
      pipeline.use(() => {
        return Response
      })

      const result = await pipeline.run(
        {
          pathname: '/foo',
        },
        {
          container: createContainer(),
        }
      )
      expect(result.info.cookies).toBeUndefined()
    })

    it('should be set when store reconnects', async () => {
      const pipeline = createRouterPipeline()
      const Session = createSessionContext({
        secret: 'farrow',
      })

      Session.store.emit('disconnect')

      pipeline.use(Session.provider())
      pipeline.use(() => {
        return Response
      })

      const result = await pipeline.run(
        {
          pathname: '/foo',
        },
        {
          container: createContainer(),
        }
      )
      expect(result.info.cookies).toBeUndefined()

      Session.store.emit('work')

      const result1 = await pipeline.run(
        {
          pathname: '/foo',
        },
        {
          container: createContainer(),
        }
      )
      expect(result1.info.cookies).toBeDefined()
    })

    it('should not continue when store block until disblock', async () => {
      const pipeline = createRouterPipeline()
      const Session = createSessionContext({
        secret: 'farrow',
      })

      Session.store.emit('block')

      pipeline.use(Session.provider())
      pipeline.use((req) => {
        return Response.text(req.pathname)
      })

      await Promise.all([
        Promise.resolve(
          pipeline.run(
            {
              pathname: '/foo',
            },
            {
              container: createContainer(),
            }
          )
        ).then((result) => {
          expect(result.info.cookies).toBeDefined()
        }),
        new Promise<void>(async (resolve) => {
          Session.store.emit('work')

          const result1 = await pipeline.run(
            {
              pathname: '/bar',
            },
            {
              container: createContainer(),
            }
          )
          expect(result1.info.cookies).toBeDefined()
          resolve()
        }),
      ])
    })
  })

  describe('.destroy()', () => {
    it('should destroy the previous session', async () => {
      const pipeline = createRouterPipeline()
      const Session = createSessionContext({
        secret: 'farrow',
        name: 'session.id',
      })

      let needDestory = false
      pipeline.use(Session.provider())
      pipeline.use(() => {
        if (needDestory) {
          Session.destory()
        } else {
          needDestory = true
        }
        return Response
      })

      const result = await pipeline.run(
        {
          pathname: '/foo',
        },
        {
          container: createContainer(),
        }
      )
      expect(result.info.cookies).toBeDefined()

      if (result.info.cookies) {
        expect(result.info.cookies['session.id']).toBeDefined()

        const cookie = result.info.cookies['session.id'].value
        const result1 = await pipeline.run(
          {
            pathname: '/bar',
            cookies: {
              'session.id': cookie,
            },
          },
          {
            container: createContainer(),
          }
        )
        expect(result1.info.cookies).toBeDefined()
        if (result1.info.cookies) {
          expect(result1.info.cookies['session.id']).toBeDefined()
          expect(result1.info.cookies['session.id'].value).not.toBe(cookie)
        }
      }
    })
  })

  describe('.refresh()', () => {
    it('should destroy/replace the previous session', async () => {
      const pipeline = createRouterPipeline()
      const Session = createSessionContext({
        secret: 'farrow',
        name: 'session.id',
      })

      let needRefresh = false
      pipeline.use(Session.provider())
      pipeline.use(() => {
        if (needRefresh) {
          Session.refresh()
        } else {
          needRefresh = true
        }
        return Response
      })

      const result = await pipeline.run(
        {
          pathname: '/foo',
        },
        {
          container: createContainer(),
        }
      )
      expect(result.info.cookies).toBeDefined()

      if (result.info.cookies) {
        expect(result.info.cookies['session.id']).toBeDefined()

        const cookie = result.info.cookies['session.id'].value
        const result1 = await pipeline.run(
          {
            pathname: '/bar',
            cookies: {
              'session.id': cookie,
            },
          },
          {
            container: createContainer(),
          }
        )
        expect(result1.info.cookies).toBeDefined()
        if (result1.info.cookies) {
          expect(result1.info.cookies['session.id']).toBeDefined()
          expect(result1.info.cookies['session.id'].value).not.toBe(cookie)
        }
      }
    })
  })

  describe('.touch()', () => {
    it('should reset session expiration', async () => {
      const pipeline = createRouterPipeline()
      const Session = createSessionContext({
        secret: 'farrow',
        name: 'session.id',
        cookie: {
          maxAge: 5000,
        },
      })

      pipeline.use(Session.provider())
      pipeline.use(async () => {
        await sleep(3000)

        Session.touch()

        return Response
      })

      const result = await pipeline.run(
        {
          pathname: '/foo',
        },
        {
          container: createContainer(),
        }
      )
      expect(result.info.cookies).toBeDefined()

      if (result.info.cookies) {
        expect(result.info.cookies['session.id']).toBeDefined()

        expect(
          result.info.cookies['session.id'].options.expires.getTime() -
            Date.now()
        ).toBeGreaterThan(3000)
      }
    })
  })
})
