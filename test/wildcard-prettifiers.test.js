'use strict'

const { test } = require('node:test')
const { Writable } = require('node:stream')
const { inspect } = require('node:util')
const pino = require('pino')
const { prettyFactory } = require('..')

test('wildcard prettifies unmatched fields in actual Pino output', t => {
  t.plan(2)
  const prettifier = t.mock.fn(value => inspect(value, { depth: null, breakLength: 4, colors: false }))
  const pretty = prettyFactory({ colorize: false, customPrettifiers: { '*': prettifier } })
  const logger = pino({ timestamp: false, base: null }, new Writable({
    write (chunk, encoding, callback) {
      t.assert.strictEqual(pretty(chunk.toString()), 'INFO:\n    foo: {\n      bar: {\n        zoo: -1\n      }\n    }\n')
      callback()
    }
  }))

  logger.info({ foo: { bar: { zoo: -1 } } })
  t.assert.strictEqual(prettifier.mock.callCount(), 1)
})

test('named prettifiers take precedence and callbacks retain their context and arguments', t => {
  const log = { level: 30, foo: 'bar', other: 'value' }
  const calls = []
  const customPrettifiers = {
    foo (value, key, record, extras) {
      t.assert.strictEqual(this, customPrettifiers)
      t.assert.strictEqual(record, log)
      t.assert.strictEqual(typeof extras.colors.red, 'function')
      calls.push(key)
      return value.toUpperCase()
    },
    '*' (value, key, record, extras) {
      t.assert.strictEqual(this, customPrettifiers)
      t.assert.strictEqual(record, log)
      t.assert.strictEqual(typeof extras.colors.red, 'function')
      calls.push(key)
      return `${key}=${value}`
    }
  }
  const pretty = prettyFactory({ colorize: false, ignore: '', customPrettifiers })

  t.assert.strictEqual(pretty(log), 'INFO:\n    foo: BAR\n    other: other=value\n')
  t.assert.deepStrictEqual(calls, ['foo', 'other'])
  t.assert.deepStrictEqual(log, { level: 30, foo: 'bar', other: 'value' })
})

test('wildcard does not replace message, timestamp, level or metadata formatting', t => {
  const keys = []
  const pretty = prettyFactory({
    colorize: false,
    translateTime: false,
    ignore: '',
    customPrettifiers: {
      '*' (value, key) {
        keys.push(key)
        return value.toUpperCase()
      }
    }
  })
  const output = pretty({ level: 30, time: 1, pid: 42, hostname: 'host', name: 'app', caller: 'module', msg: 'hello', foo: 'bar' })

  t.assert.strictEqual(output, '[1] INFO (app/42 on host) <module>: hello\n    foo: BAR\n')
  t.assert.deepStrictEqual(keys, ['foo'])
})

test('single-line output applies wildcard once and retains named precedence', t => {
  const wildcard = t.mock.fn(value => `formatted ${value}`)
  const pretty = prettyFactory({
    colorize: false,
    singleLine: true,
    customPrettifiers: { '*': wildcard, known: () => 'named' }
  })

  t.assert.strictEqual(pretty({ level: 30, foo: 7, known: 'value' }), 'INFO: {"foo":"formatted 7","known":"named"}\n')
  t.assert.strictEqual(wildcard.mock.callCount(), 1)
})

for (const [name, options, expectedKeys] of [
  ['ignore', { ignore: 'secret' }, ['foo']],
  ['include', { include: 'foo' }, ['foo']],
  ['hideObject', { hideObject: true }, []]
]) {
  test(`wildcard respects ${name}`, t => {
    const keys = []
    const pretty = prettyFactory({
      colorize: false,
      ...options,
      customPrettifiers: {
        '*' (value, key) {
          keys.push(key)
          return `formatted ${value}`
        }
      }
    })
    const output = pretty({ level: 30, foo: 'bar', secret: 'hidden' })

    t.assert.deepStrictEqual(keys, expectedKeys)
    t.assert.strictEqual(output.includes('formatted bar'), expectedKeys.length > 0)
    t.assert.strictEqual(output.includes('hidden'), false)
  })
}

test('wildcard formats custom error fields and preserves formatter-produced colors', t => {
  const keys = []
  const pretty = prettyFactory({
    colorize: true,
    errorLikeObjectKeys: ['failure'],
    customPrettifiers: {
      '*' (value, key, log, { colors }) {
        keys.push(key)
        return JSON.stringify({ stack: colors.red(`Error: ${value.message}`) }, null, 2)
      }
    }
  })
  const output = pretty({ level: 50, failure: { message: 'boom', stack: 'original' } })

  t.assert.deepStrictEqual(keys, ['failure'])
  t.assert.strictEqual(output.includes('\u001b[31mError: boom'), true)
})

test('named error prettifiers take precedence over the wildcard', t => {
  const wildcard = t.mock.fn(() => 'wildcard')
  const pretty = prettyFactory({
    colorize: false,
    errorLikeObjectKeys: ['failure'],
    customPrettifiers: { '*': wildcard, failure: () => 'named error' }
  })

  t.assert.strictEqual(pretty({ level: 30, failure: { message: 'boom' }, other: 'value' }), 'INFO:\n    other: wildcard\n    failure: named error\n')
  t.assert.strictEqual(wildcard.mock.callCount(), 1)
})

for (const singleLine of [false, true]) {
  test(`wildcard can omit normal and error fields with singleLine=${singleLine}`, t => {
    const wildcard = t.mock.fn(() => undefined)
    const pretty = prettyFactory({ colorize: false, singleLine, customPrettifiers: { '*': wildcard } })

    t.assert.strictEqual(pretty({ level: 30, foo: 'value', err: { message: 'boom' } }), singleLine ? 'INFO: {}\n' : 'INFO:\n')
    t.assert.strictEqual(wildcard.mock.callCount(), 2)
  })
}

test('a literal star property is prettified only once', t => {
  const wildcard = t.mock.fn(value => value.toUpperCase())
  const pretty = prettyFactory({ colorize: false, customPrettifiers: { '*': wildcard } })

  t.assert.strictEqual(pretty({ level: 30, '*': 'value' }), 'INFO:\n    *: VALUE\n')
  t.assert.strictEqual(wildcard.mock.callCount(), 1)
})

test('a non-function wildcard retains default formatting', t => {
  const pretty = prettyFactory({ colorize: false, customPrettifiers: { '*': false } })

  t.assert.strictEqual(pretty({ level: 30, foo: 'value' }), 'INFO:\n    foo: "value"\n')
})
