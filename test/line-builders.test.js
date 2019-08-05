'use strict'

const test = require('tap').test
const prettyFactory = require('../')

const logLine = '{"level":30,"time":1522431328992,"msg":"hello world","pid":42,"hostname":"foo","v":1}\n'

test('extensible line builders tests', (t) => {
  t.test('custom line builders are executed', (t) => {
    t.plan(1)
    const CONTENT = 'CONTENT'
    const pretty = prettyFactory({
      lineBuilders: [
        (lineParts) => {
          lineParts.push(CONTENT)
        }
      ]
    })
    const formatted = pretty(logLine)
    t.is(formatted.endsWith(CONTENT), true, `line builder did not append expected content`)
  })

  t.end()
})
