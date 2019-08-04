'use strict'

const test = require('tap').test
const prettyFactory = require('../')

const logLine = '{"level":30,"time":1522431328992,"msg":"hello world","pid":42,"hostname":"foo","v":1}\n'

test('extensible log builders tests', (t) => {
  t.test('custom log builders are executed', (t) => {
    t.plan(1)
    let executed = false
    const pretty = prettyFactory({
      logBuilders: [
        (input) => {
          executed = true
          return { output: input }
        }
      ]
    })
    const formatted = pretty(logLine)
    t.is(executed, true, `custom log builder was not executed: ${formatted}`)
  })

  t.end()
})
