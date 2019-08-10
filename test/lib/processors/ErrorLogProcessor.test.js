'use strict'

const tap = require('tap')
const { ErrorLogProcessor } = require('../../../lib/processors/ErrorLogProcessor')

tap.test('ErrorLogProcessor', t => {
  t.test('marks processed error log as handled object', async t => {
    const logProcessor = new ErrorLogProcessor()
    const log = {
      type: 'Error',
      stack: 'error stack'
    }
    const context = { log, errorProps: '' }
    logProcessor.build([], context)
    t.ok(context.objectWasHandled)
  })

  t.end()
})
