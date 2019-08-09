'use strict'

const tap = require('tap')
const getColorizer = require('../../lib/colors')
const utils = require('../../lib/utils')
const LevelLogProcessor = require('../../lib/processors/LevelLogProcessor')
const MessageLogProcessor = require('../../lib/processors/MessageLogProcessor')
const MetadataLogProcessor = require('../../lib/processors/MetadataLogProcessor')
const TimeLogProcessor = require('../../lib/processors/TimeLogProcessor')

tap.test('prettifyErrorLog', t => {
  const { prettifyErrorLog } = utils

  t.test('returns string with default settings', async t => {
    const err = Error('Something went wrong')
    const str = prettifyErrorLog({ log: err })
    t.true(str.startsWith('    Error: Something went wrong'))
  })

  t.test('returns string with custom ident', async t => {
    const err = Error('Something went wrong')
    const str = prettifyErrorLog({ log: err, ident: '  ' })
    t.true(str.startsWith('  Error: Something went wrong'))
  })

  t.test('returns string with custom eol', async t => {
    const err = Error('Something went wrong')
    const str = prettifyErrorLog({ log: err, eol: '\r\n' })
    t.true(str.startsWith(`    Error: Something went wrong\r\n`))
  })

  t.end()
})

tap.test('prettifyLevel', t => {
  const levelLogProcessor = new LevelLogProcessor()

  t.test('returns `undefined` for unknown level', async t => {
    const prettified = {}
    levelLogProcessor.parse({}, { prettified })
    t.is(prettified.prettifiedLevel, undefined)
  })

  t.test('returns non-colorized value for default colorizer', async t => {
    const log = {
      level: 30
    }
    const prettified = {}
    levelLogProcessor.parse(log, { prettified })
    t.is(prettified.prettifiedLevel, 'INFO ')
  })

  t.test('returns colorized value for color colorizer', async t => {
    const log = {
      level: 30
    }
    const prettified = {}
    const colorizer = getColorizer(true)
    levelLogProcessor.parse(log, { prettified, colorizer })
    t.is(prettified.prettifiedLevel, '\u001B[32mINFO \u001B[39m')
  })

  t.end()
})

tap.test('prettifyMessage', t => {
  const messageLogProcessor = new MessageLogProcessor()

  t.test('returns `undefined` if `messageKey` not found', async t => {
    const prettified = {}
    messageLogProcessor.parse({}, { prettified })
    t.is(prettified.prettifiedMessage, undefined)
  })

  t.test('returns `undefined` if `messageKey` not string', async t => {
    const prettified = {}
    messageLogProcessor.parse({ msg: {} }, { prettified })
    t.is(prettified.prettifiedMessage, undefined)
  })

  t.test('returns non-colorized value for default colorizer', async t => {
    const prettified = {}
    messageLogProcessor.parse({ msg: 'foo' }, { prettified })
    t.is(prettified.prettifiedMessage, 'foo')
  })

  t.test('returns non-colorized value for alternate `messageKey`', async t => {
    const prettified = {}
    messageLogProcessor.parse({ message: 'foo' }, { prettified, messageKey: 'message' })
    t.is(prettified.prettifiedMessage, 'foo')
  })

  t.test('returns colorized value for color colorizer', async t => {
    const prettified = {}
    const colorizer = getColorizer(true)
    messageLogProcessor.parse({ msg: 'foo' }, { prettified, colorizer })
    t.is(prettified.prettifiedMessage, '\u001B[36mfoo\u001B[39m')
  })

  t.test('returns colorized value for color colorizer for alternate `messageKey`', async t => {
    const prettified = {}
    const colorizer = getColorizer(true)
    messageLogProcessor.parse({ message: 'foo' }, { prettified, messageKey: 'message', colorizer })
    t.is(prettified.prettifiedMessage, '\u001B[36mfoo\u001B[39m')
  })

  t.end()
})

tap.test('prettifyMetadata', t => {
  const metadataLogProcessor = new MetadataLogProcessor()

  t.test('returns `undefined` if no metadata present', async t => {
    const prettified = {}
    metadataLogProcessor.parse({}, { prettified })
    t.is(prettified.prettifiedMetadata, undefined)
  })

  t.test('works with only `name` present', async t => {
    const prettified = {}
    metadataLogProcessor.parse({ name: 'foo' }, { prettified })
    t.is(prettified.prettifiedMetadata, '(foo)')
  })

  t.test('works with only `pid` present', async t => {
    const prettified = {}
    metadataLogProcessor.parse({ pid: '1234' }, { prettified })
    t.is(prettified.prettifiedMetadata, '(1234)')
  })

  t.test('works with only `hostname` present', async t => {
    const prettified = {}
    metadataLogProcessor.parse({ hostname: 'bar' }, { prettified })
    t.is(prettified.prettifiedMetadata, '(on bar)')
  })

  t.test('works with only `name` & `pid` present', async t => {
    const prettified = {}
    metadataLogProcessor.parse({ name: 'foo', pid: '1234' }, { prettified })
    t.is(prettified.prettifiedMetadata, '(foo/1234)')
  })

  t.test('works with only `name` & `hostname` present', async t => {
    const prettified = {}
    metadataLogProcessor.parse({ name: 'foo', hostname: 'bar' }, { prettified })
    t.is(prettified.prettifiedMetadata, '(foo on bar)')
  })

  t.test('works with only `pid` & `hostname` present', async t => {
    const prettified = {}
    metadataLogProcessor.parse({ pid: '1234', hostname: 'bar' }, { prettified })
    t.is(prettified.prettifiedMetadata, '(1234 on bar)')
  })

  t.test('works with all three present', async t => {
    const prettified = {}
    metadataLogProcessor.parse({ name: 'foo', pid: '1234', hostname: 'bar' }, { prettified })
    t.is(prettified.prettifiedMetadata, '(foo/1234 on bar)')
  })

  t.end()
})

tap.test('prettifyObject', t => {
  const { prettifyObject } = utils

  t.test('returns empty string if no properties present', async t => {
    const str = prettifyObject({ input: {} })
    t.is(str, '')
  })

  t.test('works with single level properties', async t => {
    const str = prettifyObject({ input: { foo: 'bar' } })
    t.is(str, `    foo: "bar"\n`)
  })

  t.test('works with multiple level properties', async t => {
    const str = prettifyObject({ input: { foo: { bar: 'baz' } } })
    t.is(str, `    foo: {\n      "bar": "baz"\n    }\n`)
  })

  t.test('skips specified keys', async t => {
    const str = prettifyObject({ input: { foo: 'bar', hello: 'world' }, skipKeys: ['foo'] })
    t.is(str, `    hello: "world"\n`)
  })

  t.test('ignores predefined keys', async t => {
    const str = prettifyObject({ input: { foo: 'bar', pid: 12345 } })
    t.is(str, `    foo: "bar"\n`)
  })

  t.test('works with error props', async t => {
    const err = Error('Something went wrong')
    const serializedError = {
      message: err.message,
      stack: err.stack
    }
    const str = prettifyObject({ input: { error: serializedError } })
    t.true(str.startsWith('    error:'))
    t.true(str.includes('     "message": "Something went wrong",'))
    t.true(str.includes('         Error: Something went wrong'))
  })

  t.end()
})

tap.test('prettifyTime', t => {
  const timeLogProcessor = new TimeLogProcessor()

  t.test('returns `undefined` if `time` or `timestamp` not in log', async t => {
    const prettified = {}
    timeLogProcessor.parse({}, { prettified })
    t.is(prettified.prettifiedTime, undefined)
  })

  t.test('returns prettified formatted time from custom field', async t => {
    let log = { customtime: 1554642900000 }
    let prettified = {}
    timeLogProcessor.parse(log, { prettified, translateFormat: true, timestampKey: 'customtime' })
    t.is(prettified.prettifiedTime, '[2019-04-07 13:15:00.000 +0000]')

    prettified = {}
    timeLogProcessor.parse(log, { prettified, translateFormat: false, timestampKey: 'customtime' })
    t.is(prettified.prettifiedTime, '[1554642900000]')
  })

  t.test('returns prettified formatted time', async t => {
    let log = { time: 1554642900000 }
    let prettified = {}
    timeLogProcessor.parse(log, { prettified, translateFormat: true })
    t.is(prettified.prettifiedTime, '[2019-04-07 13:15:00.000 +0000]')

    log = { timestamp: 1554642900000 }
    prettified = {}
    timeLogProcessor.parse(log, { prettified, translateFormat: true })
    t.is(prettified.prettifiedTime, '[2019-04-07 13:15:00.000 +0000]')

    log = { time: '2019-04-07T09:15:00.000-04:00' }
    prettified = {}
    timeLogProcessor.parse(log, { prettified, translateFormat: true })
    t.is(prettified.prettifiedTime, '[2019-04-07 13:15:00.000 +0000]')

    log = { timestamp: '2019-04-07T09:15:00.000-04:00' }
    prettified = {}
    timeLogProcessor.parse(log, { prettified, translateFormat: true })
    t.is(prettified.prettifiedTime, '[2019-04-07 13:15:00.000 +0000]')

    log = { time: 1554642900000 }
    prettified = {}
    timeLogProcessor.parse(log, { prettified, translateFormat: 'd mmm yyyy H:MM' })
    t.is(prettified.prettifiedTime, '[7 Apr 2019 13:15]')

    log = { timestamp: 1554642900000 }
    prettified = {}
    timeLogProcessor.parse(log, { prettified, translateFormat: 'd mmm yyyy H:MM' })
    t.is(prettified.prettifiedTime, '[7 Apr 2019 13:15]')

    log = { time: '2019-04-07T09:15:00.000-04:00' }
    prettified = {}
    timeLogProcessor.parse(log, { prettified, translateFormat: 'd mmm yyyy H:MM' })
    t.is(prettified.prettifiedTime, '[7 Apr 2019 13:15]')

    log = { timestamp: '2019-04-07T09:15:00.000-04:00' }
    prettified = {}
    timeLogProcessor.parse(log, { prettified, translateFormat: 'd mmm yyyy H:MM' })
    t.is(prettified.prettifiedTime, '[7 Apr 2019 13:15]')
  })

  t.test('passes through value', async t => {
    let log = { time: 1554642900000 }
    let prettified = {}
    timeLogProcessor.parse(log, { prettified })
    t.is(prettified.prettifiedTime, '[1554642900000]')

    log = { timestamp: 1554642900000 }
    prettified = {}
    timeLogProcessor.parse(log, { prettified })
    t.is(prettified.prettifiedTime, '[1554642900000]')

    log = { time: '2019-04-07T09:15:00.000-04:00' }
    prettified = {}
    timeLogProcessor.parse(log, { prettified })
    t.is(prettified.prettifiedTime, '[2019-04-07T09:15:00.000-04:00]')

    log = { timestamp: '2019-04-07T09:15:00.000-04:00' }
    prettified = {}
    timeLogProcessor.parse(log, { prettified })
    t.is(prettified.prettifiedTime, '[2019-04-07T09:15:00.000-04:00]')
  })

  t.end()
})
