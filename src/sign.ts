// Fork from https://github.com/tj/node-cookie-signature/blob/master/index.js
import crypto from 'crypto'

export const sign = (input: string, secret: string) => {
  return `${input}.${crypto
    .createHmac('sha256', secret)
    .update(input)
    .digest('base64')
    .replace(/\=+$/, '')}`
}

export const unsign = (input: string, secret: string) => {
  const result = input.slice(0, input.lastIndexOf('.'))
  return crypto.timingSafeEqual(
    Buffer.from(sign(result, secret)),
    Buffer.from(input)
  )
    ? result
    : false
}

export const signCookie = (input: string, secret: string) => {
  return `s:${sign(input, secret)}`
}

export const unsignCookie = (input: string, secret: string) => {
  return input.startsWith('s:') && unsign(input.slice(2), secret)
}
