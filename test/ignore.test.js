'use strict'

const { test } = require('node:test')
const { prettyFactory } = require('..')

const log = { pid: 42, hostname: 'api', msg: 'hello' }

function format (record, options) {
  return prettyFactory({ colorize: false, ...options })(record)
}

test('ignore accepts the same keys as a CSV string or an array', t => {
  const csv = format(log, { ignore: 'pid,hostname' })
  const keys = Object.freeze(['pid', 'hostname'])
  t.assert.strictEqual(csv, 'hello\n')
  t.assert.strictEqual(format(log, { ignore: keys }), csv)
})

test('an empty ignore array overrides the default hostname filter', t => {
  t.assert.strictEqual(format(log), '(42): hello\n')
  t.assert.strictEqual(format(log, { ignore: [] }), '(42 on api): hello\n')
})

test('ignore arrays use the existing nested and escaped-dot paths', t => {
  const record = { user: { id: 1, name: 'Ada' }, 'user.id': 2 }
  t.assert.strictEqual(format(record, { ignore: ['user.id'] }), format({ user: { name: 'Ada' }, 'user.id': 2 }))
  t.assert.strictEqual(format(record, { ignore: ['user\\.id'] }), format({ user: { id: 1, name: 'Ada' } }))
})

test('ignore arrays preserve commas and spaces within each key', t => {
  const record = { 'a,b': 1, a: 2, b: 3, ' key ': 4, key: 5 }
  const expected = format({ a: 2, b: 3, key: 5 })
  t.assert.strictEqual(format(record, { ignore: ['a,b', ' key '] }), expected)
})

test('ignore CSV entries keep leading spaces', t => {
  t.assert.strictEqual(format(log, { ignore: 'pid, hostname' }), '(on api): hello\n')
})

test('include takes precedence over an ignore array', t => {
  t.assert.strictEqual(format(log, { include: 'pid', ignore: ['pid'] }), '(42): hello\n')
})
