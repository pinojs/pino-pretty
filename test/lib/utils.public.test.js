'use strict'

const tap = require('tap')
const getColorizer = require('../../lib/colors')
const utils = require('../../lib/utils')

tap.test('prettifyErrorLog', t => {
  const { prettifyErrorLog } = utils

  t.test('returns string with default settings', async t => {
    let err = Error('Something went wrong')
    const str = prettifyErrorLog({ log: err })
    t.true(str.startsWith('    Error: Something went wrong'))
  })

  t.test('returns string with custom ident', async t => {
    let err = Error('Something went wrong')
    const str = prettifyErrorLog({ log: err, ident: '  ' })
    t.true(str.startsWith('  Error: Something went wrong'))
  })

  t.test('returns string with custom eol', async t => {
    let err = Error('Something went wrong')
    const str = prettifyErrorLog({ log: err, eol: '\r\n' })
    t.true(str.startsWith(`    Error: Something went wrong\r\n`))
  })

  t.end()
})

tap.test('prettifyLevel', t => {
  const { prettifyLevel } = utils

  t.test('returns `undefined` for unknown level', async t => {
    const colorized = prettifyLevel({ log: {} })
    t.is(colorized, undefined)
  })

  t.test('returns non-colorized value for default colorizer', async t => {
    const log = {
      level: 30
    }
    const colorized = prettifyLevel({ log })
    t.is(colorized, 'INFO ')
  })

  t.test('returns colorized value for color colorizer', async t => {
    const log = {
      level: 30
    }
    const colorizer = getColorizer(true)
    const colorized = prettifyLevel({ log, colorizer })
    t.is(colorized, '\u001B[32mINFO \u001B[39m')
  })

  t.end()
})

tap.test('prettifyMessage', t => {
  const { prettifyMessage } = utils

  t.test('returns `undefined` if `messageKey` not found', async t => {
    const str = prettifyMessage({ log: {} })
    t.is(str, undefined)
  })

  t.test('returns `undefined` if `messageKey` not string', async t => {
    const str = prettifyMessage({ log: { msg: {} } })
    t.is(str, undefined)
  })

  t.test('returns non-colorized value for default colorizer', async t => {
    const str = prettifyMessage({ log: { msg: 'foo' } })
    t.is(str, 'foo')
  })

  t.test('returns non-colorized value for alternate `messageKey`', async t => {
    const str = prettifyMessage({ log: { message: 'foo' }, messageKey: 'message' })
    t.is(str, 'foo')
  })

  t.test('returns colorized value for color colorizer', async t => {
    const colorizer = getColorizer(true)
    const str = prettifyMessage({ log: { msg: 'foo' }, colorizer })
    t.is(str, '\u001B[36mfoo\u001B[39m')
  })

  t.test('returns colorized value for color colorizer for alternate `messageKey`', async t => {
    const colorizer = getColorizer(true)
    const str = prettifyMessage({ log: { message: 'foo' }, messageKey: 'message', colorizer })
    t.is(str, '\u001B[36mfoo\u001B[39m')
  })

  t.end()
})

tap.test('prettifyMetadata', t => {
  const { prettifyMetadata } = utils

  t.test('returns `undefined` if no metadata present', async t => {
    const str = prettifyMetadata({ log: {} })
    t.is(str, undefined)
  })

  t.test('works with only `name` present', async t => {
    const str = prettifyMetadata({ log: { name: 'foo' } })
    t.is(str, '(foo)')
  })

  t.test('works with only `pid` present', async t => {
    const str = prettifyMetadata({ log: { pid: '1234' } })
    t.is(str, '(1234)')
  })

  t.test('works with only `hostname` present', async t => {
    const str = prettifyMetadata({ log: { hostname: 'bar' } })
    t.is(str, '(on bar)')
  })

  t.test('works with only `name` & `pid` present', async t => {
    const str = prettifyMetadata({ log: { name: 'foo', pid: '1234' } })
    t.is(str, '(foo/1234)')
  })

  t.test('works with only `name` & `hostname` present', async t => {
    const str = prettifyMetadata({ log: { name: 'foo', hostname: 'bar' } })
    t.is(str, '(foo on bar)')
  })

  t.test('works with only `pid` & `hostname` present', async t => {
    const str = prettifyMetadata({ log: { pid: '1234', hostname: 'bar' } })
    t.is(str, '(1234 on bar)')
  })

  t.test('works with all three present', async t => {
    const str = prettifyMetadata({ log: { name: 'foo', pid: '1234', hostname: 'bar' } })
    t.is(str, '(foo/1234 on bar)')
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
    let err = Error('Something went wrong')
    const str = prettifyObject({ input: { error: err } })
    t.true(str.startsWith('    error:'))
  })

  t.end()
})

tap.test('prettifyTime', t => {
  const { prettifyTime } = utils

  t.test('returns `undefined` if `time` or `timestamp` not in log', async t => {
    const str = prettifyTime({ log: {} })
    t.is(str, undefined)
  })

  t.test('returns prettified formatted time', async t => {
    let log = { time: 1554642900000 }
    let str = prettifyTime({ log, translateFormat: true })
    t.is(str, '[2019-04-07 13:15:00.000 +0000]')

    log = { timestamp: 1554642900000 }
    str = prettifyTime({ log, translateFormat: true })
    t.is(str, '[2019-04-07 13:15:00.000 +0000]')

    log = { time: '2019-04-07T09:15:00.000-04:00' }
    str = prettifyTime({ log, translateFormat: true })
    t.is(str, '[2019-04-07 13:15:00.000 +0000]')

    log = { timestamp: '2019-04-07T09:15:00.000-04:00' }
    str = prettifyTime({ log, translateFormat: true })
    t.is(str, '[2019-04-07 13:15:00.000 +0000]')

    log = { time: 1554642900000 }
    str = prettifyTime({ log, translateFormat: 'd mmm yyyy H:MM' })
    t.is(str, '[7 Apr 2019 13:15]')

    log = { timestamp: 1554642900000 }
    str = prettifyTime({ log, translateFormat: 'd mmm yyyy H:MM' })
    t.is(str, '[7 Apr 2019 13:15]')

    log = { time: '2019-04-07T09:15:00.000-04:00' }
    str = prettifyTime({ log, translateFormat: 'd mmm yyyy H:MM' })
    t.is(str, '[7 Apr 2019 13:15]')

    log = { timestamp: '2019-04-07T09:15:00.000-04:00' }
    str = prettifyTime({ log, translateFormat: 'd mmm yyyy H:MM' })
    t.is(str, '[7 Apr 2019 13:15]')
  })

  t.test('passes through value', async t => {
    let log = { time: 1554642900000 }
    let str = prettifyTime({ log })
    t.is(str, '[1554642900000]')

    log = { timestamp: 1554642900000 }
    str = prettifyTime({ log })
    t.is(str, '[1554642900000]')

    log = { time: '2019-04-07T09:15:00.000-04:00' }
    str = prettifyTime({ log })
    t.is(str, '[2019-04-07T09:15:00.000-04:00]')

    log = { timestamp: '2019-04-07T09:15:00.000-04:00' }
    str = prettifyTime({ log })
    t.is(str, '[2019-04-07T09:15:00.000-04:00]')
  })

  t.end()
})
