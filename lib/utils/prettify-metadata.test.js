'use strict'

const tap = require('tap')
const prettifyMetadata = require('./prettify-metadata')
const getColorizer = require('../colors')
const context = {
  customPrettifiers: {},
  colorizer: {
    colors: {}
  }
}

tap.test('returns `undefined` if no metadata present', async t => {
  const str = prettifyMetadata({ log: {}, context })
  t.equal(str, undefined)
})

tap.test('works with only `name` present', async t => {
  const str = prettifyMetadata({ log: { name: 'foo' }, context })
  t.equal(str, '(foo)')
})

tap.test('works with only `pid` present', async t => {
  const str = prettifyMetadata({ log: { pid: '1234' }, context })
  t.equal(str, '(1234)')
})

tap.test('works with only `hostname` present', async t => {
  const str = prettifyMetadata({ log: { hostname: 'bar' }, context })
  t.equal(str, '(on bar)')
})

tap.test('works with only `name` & `pid` present', async t => {
  const str = prettifyMetadata({ log: { name: 'foo', pid: '1234' }, context })
  t.equal(str, '(foo/1234)')
})

tap.test('works with only `name` & `hostname` present', async t => {
  const str = prettifyMetadata({ log: { name: 'foo', hostname: 'bar' }, context })
  t.equal(str, '(foo on bar)')
})

tap.test('works with only `pid` & `hostname` present', async t => {
  const str = prettifyMetadata({ log: { pid: '1234', hostname: 'bar' }, context })
  t.equal(str, '(1234 on bar)')
})

tap.test('works with only `name`, `pid`, & `hostname` present', async t => {
  const str = prettifyMetadata({ log: { name: 'foo', pid: '1234', hostname: 'bar' }, context })
  t.equal(str, '(foo/1234 on bar)')
})

tap.test('works with only `name` & `caller` present', async t => {
  const str = prettifyMetadata({ log: { name: 'foo', caller: 'baz' }, context })
  t.equal(str, '(foo) <baz>')
})

tap.test('works with only `pid` & `caller` present', async t => {
  const str = prettifyMetadata({ log: { pid: '1234', caller: 'baz' }, context })
  t.equal(str, '(1234) <baz>')
})

tap.test('works with only `hostname` & `caller` present', async t => {
  const str = prettifyMetadata({ log: { hostname: 'bar', caller: 'baz' }, context })
  t.equal(str, '(on bar) <baz>')
})

tap.test('works with only `name`, `pid`, & `caller` present', async t => {
  const str = prettifyMetadata({ log: { name: 'foo', pid: '1234', caller: 'baz' }, context })
  t.equal(str, '(foo/1234) <baz>')
})

tap.test('works with only `name`, `hostname`, & `caller` present', async t => {
  const str = prettifyMetadata({ log: { name: 'foo', hostname: 'bar', caller: 'baz' }, context })
  t.equal(str, '(foo on bar) <baz>')
})

tap.test('works with only `caller` present', async t => {
  const str = prettifyMetadata({ log: { caller: 'baz' }, context })
  t.equal(str, '<baz>')
})

tap.test('works with only `pid`, `hostname`, & `caller` present', async t => {
  const str = prettifyMetadata({ log: { pid: '1234', hostname: 'bar', caller: 'baz' }, context })
  t.equal(str, '(1234 on bar) <baz>')
})

tap.test('works with all four present', async t => {
  const str = prettifyMetadata({ log: { name: 'foo', pid: '1234', hostname: 'bar', caller: 'baz' }, context })
  t.equal(str, '(foo/1234 on bar) <baz>')
})

tap.test('uses prettifiers from passed prettifiers object', async t => {
  const prettifiers = {
    name (input) {
      return input.toUpperCase()
    },
    pid (input) {
      return input + '__'
    },
    hostname (input) {
      return input.toUpperCase()
    },
    caller (input) {
      return input.toUpperCase()
    }
  }
  const str = prettifyMetadata({
    log: { pid: '1234', hostname: 'bar', caller: 'baz', name: 'joe' },
    context: {
      customPrettifiers: prettifiers,
      colorizer: { colors: {} }
    }
  })
  t.equal(str, '(JOE/1234__ on BAR) <BAZ>')
})

tap.test('uses colorizer from passed context to colorize metadata', async t => {
  const prettifiers = {
    name (input, _key, _log, { colors }) {
      return colors.blue(input)
    },
    pid (input, _key, _log, { colors }) {
      return colors.red(input)
    },
    hostname (input, _key, _log, { colors }) {
      return colors.green(input)
    },
    caller (input, _key, _log, { colors }) {
      return colors.cyan(input)
    }
  }
  const log = { name: 'foo', pid: '1234', hostname: 'bar', caller: 'baz' }
  const colorizer = getColorizer(true)
  const context = {
    customPrettifiers: prettifiers,
    colorizer
  }

  const result = prettifyMetadata({ log, context })

  const colorizedName = colorizer.colors.blue(log.name)
  const colorizedPid = colorizer.colors.red(log.pid)
  const colorizedHostname = colorizer.colors.green(log.hostname)
  const colorizedCaller = colorizer.colors.cyan(log.caller)
  const expected = `(${colorizedName}/${colorizedPid} on ${colorizedHostname}) <${colorizedCaller}>`

  t.equal(result, expected)
})
