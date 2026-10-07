'use strict'

const { test } = require('node:test')
const getLogPropertyValue = require('./get-log-property-value')

test('returns an inherited top-level log property', t => {
  const log = Object.create({ msg: 'inherited' })

  t.assert.strictEqual(getLogPropertyValue(log, 'msg'), 'inherited')
})

test('returns an own nested log property', t => {
  const log = { payload: { text: 'nested' } }

  t.assert.strictEqual(getLogPropertyValue(log, 'payload.text'), 'nested')
})

test('does not traverse inherited nested log properties', t => {
  const log = { payload: Object.create({ text: 'inherited' }) }

  t.assert.strictEqual(getLogPropertyValue(log, 'payload.text'), undefined)
})
