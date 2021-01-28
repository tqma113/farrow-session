import { Http, Response, Router } from 'farrow-http'
import { createSessionContext } from '../src'

const http = Http()
const user = Router()

const Session = createSessionContext({
  secret: 'farrow.session'
})

http.route('/user').use(Session.provider()).use(user)

user.match({
    url: '/',
    method: ['GET', 'POST'],
  })
  .use((req, next) => {
    const sid = Session.id
    return Response.text(`Hello world! ${sid}`)
  })

http.listen(3600)