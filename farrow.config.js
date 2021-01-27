const { createFarrowConfig } = require('farrow')

module.exports = createFarrowConfig({
  server: {
    entry: 'index.ts',
    src: 'example',
    dist: 'example/dist',
  },
})
