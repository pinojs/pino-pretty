'use strict'

const { test } = require('tap')
const { internals } = require('../lib/utils')

test('joinLinesWithIndentation adds indentation to beginning of subsequent lines', (t) => {
  t.plan(1)
  const input = 'foo\nbar\nbaz'
  const result = internals.joinLinesWithIndentation({ input })
  t.is(result, 'foo\n    bar\n    baz')
})

test('joinLinesWithIndentation accepts custom indentation, line breaks, and eol', (t) => {
  t.plan(1)
  const input = 'foo\nbar\r\nbaz'
  const result = internals.joinLinesWithIndentation({ input, ident: '  ', eol: '^' })
  t.is(result, 'foo^  bar^  baz')
})
