import { Response, createRouterPipeline } from 'farrow-http'

import { createSessionContext } from '../src'

describe("session", () => {
  it('should do nothing if context has been inited', async () => {
    const pipeline = createRouterPipeline()
    const Session = createSessionContext({
      secret: 'farrow'
    })

    pipeline.use((req, next) => {
      Session.generate()
      return next()
    })
    pipeline.use(Session.provider())
    pipeline.use(() => {
      return Response
    })
    
    const result = await pipeline.run({
      pathname: '/foo',
    })
    expect(result.info.cookies).toBeUndefined()
  })

  it('should generate a new session', async () => {
    const pipeline = createRouterPipeline()
    const Session = createSessionContext({
      secret: 'farrow',
      name: 'session.id'
    })

    pipeline.use(Session.provider())
    pipeline.use(() => {
      return Response
    })
    
    const result = await pipeline.run({
      pathname: '/foo',
    })
    expect(result.info.cookies).toBeDefined()
    if (result.info.cookies) {
      expect(result.info.cookies['session.id']).toBeDefined()
    }
  })

  it('should load session from cookie session.id', async () => {
    const pipeline = createRouterPipeline()
    const Session = createSessionContext({
      secret: 'farrow',
      name: 'session.id'
    })

    pipeline.use(Session.provider())
    pipeline.use(() => {
      return Response
    })
    
    const result = await pipeline.run({
      pathname: '/foo0',
    })
    expect(result.info.cookies).toBeDefined()

    if (result.info.cookies) {
      expect(result.info.cookies['session.id']).toBeDefined()

      const cookie = result.info.cookies['session.id'].value
      const result1 = await pipeline.run({
        pathname: '/foo1',
        cookies: {
          'session.id': cookie
        }
      })
      expect(result1.info.cookies).toBeDefined()
      if (result1.info.cookies) {
        expect(result1.info.cookies['session.id']).toBeDefined()
        expect(result1.info.cookies['session.id'].value).toBe(cookie)
      }
    }
  })
})