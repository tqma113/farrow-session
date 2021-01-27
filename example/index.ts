require('source-map-support').install()

import { Response, createRouterPipeline } from 'farrow-http'
import { createContainer } from 'farrow-pipeline'

import { createSessionContext } from '../src'

import { sleep } from '../test/util'

const pipeline = createRouterPipeline()
const Session = createSessionContext({
  secret: 'farrow',
})

let isFrist = true
pipeline.use(Session.provider())
pipeline.use(async (req) => {
  const id = Session.id
  console.log('---------next--------', req.pathname, id)
  if (isFrist) {
    Session.store.emit('block')

    await sleep(1000)

    Session.store.emit('work')

    isFrist = false
  }
  return Response.text(req.pathname)
})

Promise.all([
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
    // expect(result.info.cookies).toBeDefined()
  }),
  Promise.resolve(
    pipeline.run(
      {
        pathname: '/bar',
      },
      {
        container: createContainer(),
      }
    )
  ).then((result) => {
    // expect(result.info.cookies).toBeDefined()
  }),
  Promise.resolve(
    pipeline.run(
      {
        pathname: '/baz',
      },
      {
        container: createContainer(),
      }
    )
  ).then((result) => {
    // expect(result.info.cookies).toBeDefined()
  }),
])

process.on('unhandledRejection', console.log)
