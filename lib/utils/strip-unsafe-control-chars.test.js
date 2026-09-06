'use strict'

const { test } = require('node:test')
const stripUnsafeControlChars = require('./strip-unsafe-control-chars')

test('coerces values before stripping unsafe control characters', t => {
  const value = ['before\t\u001B[2J\nafter\u009B[3J']
  t.assert.strictEqual(stripUnsafeControlChars(value), 'before\t[2J\nafter[3J')
})

test('strips trailing line terminators (issue #414)', t => {
  t.assert.strictEqual(stripUnsafeControlChars('frame= 2000 speed= 7.8x\r\n'), 'frame= 2000 speed= 7.8x')
  t.assert.strictEqual(stripUnsafeControlChars('a\n'), 'a')
  t.assert.strictEqual(stripUnsafeControlChars('a\r'), 'a')
  t.assert.strictEqual(stripUnsafeControlChars('a\r\r\n'), 'a')
})

test('preserves interior newlines and tabs', t => {
  t.assert.strictEqual(stripUnsafeControlChars('line1\nline2\ttab'), 'line1\nline2\ttab')
  t.assert.strictEqual(stripUnsafeControlChars('no terminators'), 'no terminators')
})
