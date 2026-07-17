'use strict'

const { test } = require('node:test')
const stripUnsafeControlChars = require('./strip-unsafe-control-chars')

test('coerces values before stripping unsafe control characters', t => {
  const value = ['before\t\u001B[2J\nafter\u009B[3J']
  t.assert.strictEqual(stripUnsafeControlChars(value), 'before\t[2J\nafter[3J')
})
