import warning from 'tiny-warning'

// https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Set-Cookie/SameSite
export type SameSite = 'None' | 'Strict' | 'Lax'

// https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies
export type CookieJSON = {
  // Specifies the value for the Domain Set-Cookie attribute.
  // By default, no domain is set, and most clients will consider the cookie to
  // apply to only the current domain.
  domain: string,
  // Specifies the Date object to be the value for the Expires Set-Cookie attribute.
  // By default, no expiration is set, and most clients will consider this a
  // "non-persistent cookie" and will delete it on a condition like exiting a
  // web browser application.
  // 
  // Note: If both expires and maxAge are set in the options, then the last one 
  // defined in the object is what is used.
  //
  // Note: The expires option should not be set directly; instead only use the
  // maxAge option.
  expires: Date,
  // Specifies the boolean value for the HttpOnly Set-Cookie attribute. When
  // truthy, the HttpOnly attribute is set, otherwise it is not. By default,
  // the HttpOnly attribute is set.
  // 
  // Note: be careful when setting this to true, as compliant clients will not
  // allow client-side JavaScript to see the cookie in document.cookie.
  httpOnly: boolean
  // Specifies the number (in milliseconds) to use when calculating the Expires
  // Set-Cookie attribute. This is done by taking the current server time and
  // adding maxAge milliseconds to the value to calculate an Expires datetime.
  // By default, no maximum age is set.
  // 
  // Note: If both expires and maxAge are set in the options, then the last one
  // defined in the object is what is used.
  maxAge: number
  // Specifies the value for the Path Set-Cookie. By default, this is set to
  // '/', which is the root path of the domain.
  path: string
  // Specifies the boolean or string to be the value for the SameSite
  // Set-Cookie attribute. By default, this is set to 'None'.
  //
  // Note: This is an attribute that has not yet been fully standardized, and
  // may change in the future. This also means many clients may ignore this
  // attribute until they understand it.
  sameSite: SameSite
  // Specifies the boolean value for the Secure Set-Cookie attribute. When
  // truthy, the Secure attribute is set, otherwise it is not. By default,
  // the Secure attribute is not set.
  //
  // Note: be careful when setting this to true, as compliant clients will not
  // send the cookie back to the server in the future if the browser does not
  // have an HTTPS connection.
  secure: boolean
}

export type CookieOptions = Partial<CookieJSON> & {
  originalMaxAge?: number | null
}

export type Cookie = {
  domain?: string,
  expires?: Date,
  httpOnly: boolean
  maxAge?: number
  path: string
  sameSite?: SameSite
  secure?: boolean
  originalMaxAge?: number
  readonly data: CookieData
}

// Use expires to record max-age
export type CookieData = Omit<Cookie, 'maxAge' | 'data'>

const DEFAULT_PATH = '/'
const DEFAULT_EXPIRES = undefined
const DEFAULT_HTTP_ONLY = true

export const isValidDate = (input: any): input is Date => {
  return input instanceof Date && !isNaN(input.getTime());
}

export const isValidSameSite = (input: any): input is SameSite => {
  return typeof input === 'string' && ['None', 'Strict', 'Lax'].includes(input)
}

export const createCookie = (options: CookieOptions = {}): Cookie => {
  let domain          = options.domain 
  let path            = typeof options.path === 'string' ? options.path : DEFAULT_PATH
  let maxAge          = options.maxAge
  let httpOnly        = typeof options.httpOnly === 'boolean' ? options.httpOnly : DEFAULT_HTTP_ONLY
  // 同时设置了 expires 和 max-age,
  // 所有支持 max-age 的浏览器会忽略 expires 的值
  // 只有 IE 另外，IE 会忽略 max-age 只支持 expires，默认保留 max-age
  let expires         = maxAge ? new Date(Date.now() + maxAge) : isValidDate(options.expires) ? options.expires : DEFAULT_EXPIRES
  let sameSite        = isValidSameSite(options.sameSite) ? options.sameSite : undefined
  let secure          = typeof options.secure === 'boolean' ? options.secure : true
  let originalMaxAge  = typeof options.originalMaxAge === 'number' ? options.originalMaxAge : maxAge

  return {
    path,
    domain,
    httpOnly,
    sameSite,
    secure,
    originalMaxAge,
    set expires(date: Date) {
      if (isValidDate(date)) {
        if (maxAge) {
          maxAge = undefined
          originalMaxAge = maxAge
        }
        expires = date
      } else {
        warning(false, 'invalid date set to `expires`')
      }
    },
    get expires() {
      // @ts-ignore
      return expires
    },
    set maxAge(maxAge: number) {
      expires = new Date(Date.now() + maxAge)
    },
    get maxAge() {
      // @ts-ignore
      return expires ? expires.valueOf() - Date.now() : expires
    },
    get data() {
      return {
        originalMaxAge,
        expires,
        secure,
        httpOnly,
        domain,
        path,
        sameSite
      }
    }
  }
}
