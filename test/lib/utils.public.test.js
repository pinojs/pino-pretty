'use strict'

const tap = require('tap')
const getColorizer = require('../../lib/colors')
const { prettifyLevel } = require('../../lib/processors/LevelLogProcessor')
const { prettifyMessage } = require('../../lib/processors/MessageLogProcessor')
const { prettifyMetadata } = require('../../lib/processors/MetadataLogProcessor')
const { prettifyTime } = require('../../lib/processors/TimeLogProcessor')
const { prettifyErrorLog, prettifyObject } = require('../../lib/processors/ObjectOrErrorLogProcessor')

tap.test('prettifyErrorLog', t => {
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
  t.test('returns `undefined` for unknown level', async t => {
    const prettified = {}
    prettifyLevel({}, { prettified })
    t.is(prettified.prettifiedLevel, undefined)
  })

  t.test('returns non-colorized value for default colorizer', async t => {
    const log = {
      level: 30
    }
    const prettified = {}
    prettifyLevel(log, { prettified })
    t.is(prettified.prettifiedLevel, 'INFO ')
  })

  t.test('returns colorized value for color colorizer', async t => {
    const log = {
      level: 30
    }
    const prettified = {}
    const colorizer = getColorizer(true)
    prettifyLevel(log, { prettified, colorizer })
    t.is(prettified.prettifiedLevel, '\u001B[32mINFO \u001B[39m')
  })

  t.end()
})

tap.test('prettifyMessage', t => {
  t.test('returns `undefined` if `messageKey` not found', async t => {
    const prettified = {}
    prettifyMessage({}, { prettified })
    t.is(prettified.prettifiedMessage, undefined)
  })

  t.test('returns `undefined` if `messageKey` not string', async t => {
    const prettified = {}
    prettifyMessage({ msg: {} }, { prettified })
    t.is(prettified.prettifiedMessage, undefined)
  })

  t.test('returns non-colorized value for default colorizer', async t => {
    const prettified = {}
    prettifyMessage({ msg: 'foo' }, { prettified })
    t.is(prettified.prettifiedMessage, 'foo')
  })

  t.test('returns non-colorized value for alternate `messageKey`', async t => {
    const prettified = {}
    prettifyMessage({ message: 'foo' }, { prettified, messageKey: 'message' })
    t.is(prettified.prettifiedMessage, 'foo')
  })

  t.test('returns colorized value for color colorizer', async t => {
    const prettified = {}
    const colorizer = getColorizer(true)
    prettifyMessage({ msg: 'foo' }, { prettified, colorizer })
    t.is(prettified.prettifiedMessage, '\u001B[36mfoo\u001B[39m')
  })

  t.test('returns colorized value for color colorizer for alternate `messageKey`', async t => {
    const prettified = {}
    const colorizer = getColorizer(true)
    prettifyMessage({ message: 'foo' }, { prettified, messageKey: 'message', colorizer })
    t.is(prettified.prettifiedMessage, '\u001B[36mfoo\u001B[39m')
  })

  t.end()
})

tap.test('prettifyMetadata', t => {
  t.test('returns `undefined` if no metadata present', async t => {
    const prettified = {}
    prettifyMetadata({}, { prettified })
    t.is(prettified.prettifiedMetadata, undefined)
  })

  t.test('works with only `name` present', async t => {
    const prettified = {}
    prettifyMetadata({ name: 'foo' }, { prettified })
    t.is(prettified.prettifiedMetadata, '(foo)')
  })

  t.test('works with only `pid` present', async t => {
    const prettified = {}
    prettifyMetadata({ pid: '1234' }, { prettified })
    t.is(prettified.prettifiedMetadata, '(1234)')
  })

  t.test('works with only `hostname` present', async t => {
    const prettified = {}
    prettifyMetadata({ hostname: 'bar' }, { prettified })
    t.is(prettified.prettifiedMetadata, '(on bar)')
  })

  t.test('works with only `name` & `pid` present', async t => {
    const prettified = {}
    prettifyMetadata({ name: 'foo', pid: '1234' }, { prettified })
    t.is(prettified.prettifiedMetadata, '(foo/1234)')
  })

  t.test('works with only `name` & `hostname` present', async t => {
    const prettified = {}
    prettifyMetadata({ name: 'foo', hostname: 'bar' }, { prettified })
    t.is(prettified.prettifiedMetadata, '(foo on bar)')
  })

  t.test('works with only `pid` & `hostname` present', async t => {
    const prettified = {}
    prettifyMetadata({ pid: '1234', hostname: 'bar' }, { prettified })
    t.is(prettified.prettifiedMetadata, '(1234 on bar)')
  })

  t.test('works with all three present', async t => {
    const prettified = {}
    prettifyMetadata({ name: 'foo', pid: '1234', hostname: 'bar' }, { prettified })
    t.is(prettified.prettifiedMetadata, '(foo/1234 on bar)')
  })

  t.end()
})

tap.test('prettifyObject', t => {
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
  t.test('returns `undefined` if `time` or `timestamp` not in log', async t => {
    const prettified = {}
    prettifyTime({}, { prettified })
    t.is(prettified.prettifiedTime, undefined)
  })

  t.test('returns prettified formatted time from custom field', async t => {
    let log = { customtime: 1554642900000 }
    let prettified = {}
    prettifyTime(log, { prettified, translateFormat: true, timestampKey: 'customtime' })
    t.is(prettified.prettifiedTime, '[2019-04-07 13:15:00.000 +0000]')

    prettified = {}
    prettifyTime(log, { prettified, translateFormat: false, timestampKey: 'customtime' })
    t.is(prettified.prettifiedTime, '[1554642900000]')
  })

  t.test('returns prettified formatted time', async t => {
    let log = { time: 1554642900000 }
    let prettified = {}
    prettifyTime(log, { prettified, translateFormat: true })
    t.is(prettified.prettifiedTime, '[2019-04-07 13:15:00.000 +0000]')

    log = { timestamp: 1554642900000 }
    prettified = {}
    prettifyTime(log, { prettified, translateFormat: true })
    t.is(prettified.prettifiedTime, '[2019-04-07 13:15:00.000 +0000]')

    log = { time: '2019-04-07T09:15:00.000-04:00' }
    prettified = {}
    prettifyTime(log, { prettified, translateFormat: true })
    t.is(prettified.prettifiedTime, '[2019-04-07 13:15:00.000 +0000]')

    log = { timestamp: '2019-04-07T09:15:00.000-04:00' }
    prettified = {}
    prettifyTime(log, { prettified, translateFormat: true })
    t.is(prettified.prettifiedTime, '[2019-04-07 13:15:00.000 +0000]')

    log = { time: 1554642900000 }
    prettified = {}
    prettifyTime(log, { prettified, translateFormat: 'd mmm yyyy H:MM' })
    t.is(prettified.prettifiedTime, '[7 Apr 2019 13:15]')

    log = { timestamp: 1554642900000 }
    prettified = {}
    prettifyTime(log, { prettified, translateFormat: 'd mmm yyyy H:MM' })
    t.is(prettified.prettifiedTime, '[7 Apr 2019 13:15]')

    log = { time: '2019-04-07T09:15:00.000-04:00' }
    prettified = {}
    prettifyTime(log, { prettified, translateFormat: 'd mmm yyyy H:MM' })
    t.is(prettified.prettifiedTime, '[7 Apr 2019 13:15]')

    log = { timestamp: '2019-04-07T09:15:00.000-04:00' }
    prettified = {}
    prettifyTime(log, { prettified, translateFormat: 'd mmm yyyy H:MM' })
    t.is(prettified.prettifiedTime, '[7 Apr 2019 13:15]')
  })

  t.test('passes through value', async t => {
    let log = { time: 1554642900000 }
    let prettified = {}
    prettifyTime(log, { prettified })
    t.is(prettified.prettifiedTime, '[1554642900000]')

    log = { timestamp: 1554642900000 }
    prettified = {}
    prettifyTime(log, { prettified })
    t.is(prettified.prettifiedTime, '[1554642900000]')

    log = { time: '2019-04-07T09:15:00.000-04:00' }
    prettified = {}
    prettifyTime(log, { prettified })
    t.is(prettified.prettifiedTime, '[2019-04-07T09:15:00.000-04:00]')

    log = { timestamp: '2019-04-07T09:15:00.000-04:00' }
    prettified = {}
    prettifyTime(log, { prettified })
    t.is(prettified.prettifiedTime, '[2019-04-07T09:15:00.000-04:00]')
  })

  t.end()
})
