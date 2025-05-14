'use strict'

const { test } = require('node:test')
const noop = require('./noop')

test('is a function', async t => {
  t.assert.strictEqual(typeof noop, 'function')
})

test('does nothing', async t => {
  t.assert.strictEqual(noop('stuff'), undefined)
})
