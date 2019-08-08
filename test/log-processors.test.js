'use strict'

const test = require('tap').test
const {
  LogProcessor,
  createLogProcessor,
  builtInlogProcessors
} = require('../lib/log-processors')

test('createLogProcessor', (t) => {
  t.test('LogProcessor instance is returned as is', (t) => {
    t.plan(1)
    const definition = new LogProcessor()
    const result = createLogProcessor(definition)
    t.is(result, definition)
  })

  t.test('LogProcessor descendant is instantiated', (t) => {
    t.plan(1)
    const definition = class DescendantLogProcessor extends LogProcessor { }
    const result = createLogProcessor(definition)
    t.type(result, definition)
  })

  t.test('parse function is wrapped in LogProcessor-like object', (t) => {
    t.plan(1)
    const definition = () => { }
    const result = createLogProcessor(definition)
    t.match(result, { parse: definition })
  })

  t.test('built-in log processor returned by name', (t) => {
    t.plan(1)
    const definition = Object.keys(builtInlogProcessors)[0]
    const result = createLogProcessor(definition)
    t.type(result, builtInlogProcessors[definition])
  })

  t.end()
})
