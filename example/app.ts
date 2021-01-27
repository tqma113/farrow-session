import { Http } from 'farrow-http'

import { foo } from './foo'
import { bar } from './bar'

const http = Http()

http.use(foo)
http.use(bar)

http.listen(3600)
