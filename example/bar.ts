import { Response, Router } from "farrow-http";
import { createSessionContext } from '../src'

export const bar = Router();

const Session = createSessionContext({
  secret: 'farrow'
})

bar.use(Session.provider())

bar
  .match({
    url: "/secret",
    method: ["GET", "POST"]
  })
  .use((req, next) => {
    const sid = Session.id
    if (sid) {
      return Response.text(`Secret Hello world!${sid}`)
    } else {
      return Response.text('Session deny!')
    }
  })

bar.match({
  url: "/logout",
  method: ["GET", "POST"]
}).use((req, next) => {
  Session.destory()
  return Response.text('Logout!')
})