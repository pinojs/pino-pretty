'use strict'

const test = require('tap').test
const prettyFactory = require('../')
const { defaultLogParsingSequence, builtInLogProcessors } = require('../lib/log-processors')

const logLine = '{"level":30,"time":1522431328992,"msg":"hello world","pid":42,"hostname":"foo","v":1}\n'

test('extensible log parsers tests', (t) => {
  t.test('custom log parsers are executed', (t) => {
    t.plan(1)
    let executed = false
    const pretty = prettyFactory({
      processors: [
        (input) => {
          executed = true
          return input
        }
      ]
    })
    const formatted = pretty(logLine)
    t.is(executed, true, `custom log parser was not executed: ${formatted}`)
  })

  t.test('manually specifying built-in loggers is same as default behavior', (t) => {
    t.plan(1)
    const names = Object.entries(builtInLogProcessors)
      .reduce((names, { key, value }) => {
        const index = defaultLogParsingSequence.indexOf(value)
        if (index > -1) {
          names[index] = key
        }
      }, [])
    const builtInPretty = prettyFactory()
    const customPretty = prettyFactory({
      processors: names
    })
    const builtInOutput = builtInPretty(logLine)
    const customOutput = customPretty(logLine)
    t.is(customOutput, builtInOutput, `custom with built-in is not the same as default`)
  })

  t.test('always use built-in json log parser as first step when using custom log parsers', (t) => {
    t.plan(1)
    let wasParsed = false
    const customPretty = prettyFactory({
      processors: [(log) => {
        wasParsed = typeof log === 'object'
      }]
    })
    customPretty(logLine)
    t.is(wasParsed, true, `the json log parser wasn't executed`)
  })

  t.end()
})
