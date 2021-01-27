import { Http, Response } from 'farrow-http'
import { createSessionContext } from '../src'

const http = Http()

const Session = createSessionContext({
  secret: 'farrow.session'
})

http.use(Session.provider())

http.use(() => {
  const sid = Session.id
  return Response.text(`Hello world! ${sid}`)
})

http.listen(3600)