# farrow-session

<p align="center">
  <a href="https://github.com/tqma113/farrow-session#readme">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" style="max-width:100%;">
  </a>
  <a href="https://github.com/tqma113/farrow-session/actions">
    <img alt="Action Status" src="https://github.com/tqma113/farrow-session/workflows/Test/badge.svg" style="max-width:100%;">
  </a>
  <a href="https://github.com/tqma/farrow-session/blob/master/LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg" style="max-width:100%;">
  </a>
</p>

A session middleware for farrow.

## Install

Unpublsihed

## Frist Look

```ts
import { Http, Response } from 'farrow-http'
import { createSessionContext } from '../src'

const http = Http()

const Session = createSessionContext({
  secret: 'farrow.session'
})

http.use(Session.provider())

http.match({
    url: '/',
    method: ['GET', 'POST'],
  })
  .use((req, next) => {
    const sid = Session.id
    return Response.text(`Hello world! ${sid}`)
  })

http.listen(3600)
```

## Options

### cookie

Settings object for the session ID cookie. The default value is { path: '/', httpOnly: true, secure: false, maxAge: undefined }.

The following are options that can be set in this object.

#### cookie.domain

> Type: `string | undefined`
>
> Default: `undefined`

Specifies the value for the Domain `Set-Cookie` attribute. By default, no domain is set, and most clients will consider the cookie to apply to only the current domain.

#### cookie.path

> Type: `string | undefined`
>
> Default: `'/'`

Specifies the value for the Path Set-Cookie.

#### cookie.expires

> Type: `Date | undefined`
>
> Default: `undefined`

Specifies the Date object to be the value for the Expires Set-Cookie attribute. By default, no expiration is set, and most clients will consider this a "non-persistent cookie" and will delete it on a condition like exiting a web browser application.

Note If both expires and maxAge are set in the options, then the last one defined in the object is what is used.

Note The expires option should not be set directly; instead only use the maxAge option.

#### cookie.httpOnly

> Type: `boolean`
>
> Default: `true`

Specifies the boolean value for the HttpOnly Set-Cookie attribute. When truthy, the HttpOnly attribute is set, otherwise it is not.

Note be careful when setting this to true, as compliant clients will not allow client-side JavaScript to see the cookie in document.cookie.

#### cookie.maxAge

> Type: `number | undefined`
>
> Default: `undefined`

Specifies the number (in milliseconds) to use when calculating the Expires Set-Cookie attribute. This is done by taking the current server time and adding maxAge milliseconds to the value to calculate an Expires datetime. By default, no maximum age is set.

Note If both expires and maxAge are set in the options, then the last one defined in the object is what is used.

#### cookie.sameSite

> Type: `'None' | 'Strict' | 'Lax'`
>
> Default: `'None'`

Specifies the string to be the value for the SameSite Set-Cookie attribute.

+ 'Lax' will set the `SameSite` attribute to `Lax` for lax same site enforcement.
+ 'None' will set the `SameSite` attribute to `None` for an explicit cross-site cookie.
+ 'Strict' will set the `SameSite` attribute to `Strict` for strict same site enforcement.

Detail at [SameSite](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

#### cookie.secure

> Type: `boolean`
>
> Default: `true`

Specifies the boolean value for the Secure Set-Cookie attribute. When truthy, the Secure attribute is set, otherwise it is not. By default, the Secure attribute is not set.

Note be careful when setting this to true, as compliant clients will not send the cookie back to the server in the future if the browser does not have an HTTPS connection.

### genid

> Type: `() => string`
>
> Default: [uuid](https://github.com/uuidjs/uuid).v4

Function to call to generate a new session ID. Provide a function that returns a string that will be used as a session ID.

### name

> Type: `string`
>
> Default: `'connect.sid'`

The name of the session ID cookie to set in the response (and read from in the request).

### proxy

> Type: `boolean`
>
> Default: `true`

Trust the reverse proxy when setting secure cookies (via the "X-Forwarded-Proto" header).

### store

> Type: [Store](https://github.com/tqma113/farrow-session/blob/c765384cc957a2df0af2c921e02c33a9154c27c6/src/store.ts#L4)
>
> Default: [MemoryStore](https://github.com/tqma113/farrow-session/blob/c765384cc957a2df0af2c921e02c33a9154c27c6/src/store.ts#L13)

Every session store must be an EventEmitter and implement specific methods. The following methods are the list of required, recommended, and optional.

#### store.get

> Type: `(sid: string) => SessionData | false`

Get [SessionData](https://github.com/tqma113/farrow-session/blob/c765384cc957a2df0af2c921e02c33a9154c27c6/src/session.ts#L4) by session ID.

#### store.set

> Type: `(sid: string, session: Session) => void`

Set `SessionData` for a new session.

#### store.touch

> Type: `(sid: string, session: Session) => void`

Upate expire time for the session.

#### store.destroy

> Type: `(sid: string) => void`

Remove the session data for the session.

#### store.clear

> Type: `() => void`

Remove all the session data in this store.

#### store.length

> Type: `() => number`

Get the amount of sessions in this store.

## API

Should call in farrow middleware otherwise operation is invalid.

### Session.id

> Type: `string | undefined`

Each session has a unique ID associated with it and cannot be modified.

### Session.cookie

> Type: [Cookie](https://github.com/tqma113/farrow-session/blob/c765384cc957a2df0af2c921e02c33a9154c27c6/src/cookie.ts#L62)

Each session has a unique cookie object accompany it. This allows you to alter the session cookie per visitor.

### Session.generate

> Type: `() => Session`

Generage a new Session for current request.

### Session.destory

> Type: `() => Session`

Remove current session and message for current request.

### Session.touch

> Type: `() => Session`

Upate expire time of current session.

### Session.store

The storage object of session data. You can access this object by this way.
