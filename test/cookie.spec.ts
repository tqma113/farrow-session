import { createCookie } from '../src/cookie'

describe('new Cookie()', function () {
  it('should create a new cookie object', function () {
    expect(typeof createCookie()).toBe('object')
  })

  it('should default expires to undefined', function () {
    const cookie = createCookie()
    expect(cookie.expires).toBe(undefined)
  })

  it('should default httpOnly to true', function () {
    const cookie = createCookie()
    expect(cookie.httpOnly).toBe(true)
  })

  it('should default path to "/"', function () {
    const cookie = createCookie()
    expect(cookie.path).toBe('/')
  })

  it('should default maxAge to undefined', function () {
    const cookie = createCookie()
    expect(cookie.maxAge).toBe(undefined)
  })

  describe('with options', function () {
    it('should create a new cookie object', function () {
      expect(typeof createCookie({})).toBe('object')
    })

    describe('expires', function () {
      it('should set expires', function () {
        const expires = new Date(Date.now() + 60000)
        const cookie = createCookie({ expires: expires })
        expect(cookie.expires).toBe(expires)

        const expires1 = new Date(Date.now() + 7000)
        cookie.expires = expires1
        expect(cookie.expires).toBe(expires1)

        const expires2 = new Date('invalid')
        cookie.expires = expires2
        expect(cookie.expires).toBe(expires1)

        cookie.maxAge = 10000
        expect(cookie.maxAge).toBe(10000)
        const expires3 = new Date(Date.now() + 7000)
        cookie.expires = expires3
        expect(cookie.expires).toBe(expires3)
        expect(cookie.maxAge).toBeDefined()
      })

      it('should set maxAge', function () {
        const expires = new Date(Date.now() + 60000)
        const cookie = createCookie({ expires: expires })

        expect(
          expires.getTime() - Date.now() - 1000 <= cookie.maxAge!
        ).toBeTruthy()
        expect(
          expires.getTime() - Date.now() + 1000 >= cookie.maxAge!
        ).toBeTruthy()
      })
    })

    describe('httpOnly', function () {
      it('should set httpOnly', function () {
        const cookie = createCookie({ httpOnly: false })

        expect(cookie.httpOnly).toBe(false)
      })
    })

    describe('maxAge', function () {
      it('should set expires', function () {
        const maxAge = 60000
        const cookie = createCookie({ maxAge: maxAge })

        expect(
          cookie.expires!.getTime() - Date.now() - 1000 <= maxAge
        ).toBeTruthy()
        expect(
          cookie.expires!.getTime() - Date.now() + 1000 >= maxAge
        ).toBeTruthy()
      })

      it('should set maxAge', function () {
        const maxAge = 60000
        const cookie = createCookie({ maxAge: maxAge })

        expect(typeof cookie.maxAge).toBe('number')
        expect(cookie.maxAge! - 1000 <= maxAge).toBeTruthy()
        expect(cookie.maxAge! + 1000 >= maxAge).toBeTruthy()
      })
    })

    describe('path', function () {
      it('should set path', function () {
        const cookie = createCookie({ path: '/foo' })

        expect(cookie.path).toBe('/foo')
      })
    })
  })

  describe('data', () => {
    it('default', () => {
      const cookie = createCookie()
      const data = cookie.data

      expect(data.path).toBe('/')
      expect(data.expires).toBe(undefined)
      expect(data.httpOnly).toBe(true)
    })
  })
})
