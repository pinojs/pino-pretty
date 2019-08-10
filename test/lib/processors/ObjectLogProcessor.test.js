'use strict'

const tap = require('tap')
const { ObjectLogProcessor } = require('../../../lib/processors/ObjectLogProcessor')

tap.test('ObjectLogProcessor', t => {
  t.test('skips specified object keys', async t => {
    const logProcessor = new ObjectLogProcessor()
    const log = {
      msg: 'the message',
      skipThis: 'whatever'
    }
    const skipObjectKeys = ['skipThis']
    const lineParts = []
    logProcessor.build(lineParts, { log, skipObjectKeys })
    t.same(lineParts, [`    msg: "${log.msg}"\n`])
  })

  t.test('do not prettify previously handled object', async t => {
    const logProcessor = new ObjectLogProcessor()
    const log = {
      msg: 'the message',
      another: 'property',
      objectWasHandled: true
    }
    const lineParts = []
    logProcessor.build(lineParts, { log, objectWasHandled: true })
    t.same(lineParts, [])
  })

  t.end()
})
