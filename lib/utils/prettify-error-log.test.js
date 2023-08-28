'use strict'

const tap = require('tap')
const prettifyErrorLog = require('./prettify-error-log')

tap.test('returns string with default settings', async t => {
  const err = Error('Something went wrong')
  const str = prettifyErrorLog({ log: err })
  t.ok(str.startsWith('    Error: Something went wrong'))
})

tap.test('returns string with custom ident', async t => {
  const err = Error('Something went wrong')
  const str = prettifyErrorLog({ log: err, ident: '  ' })
  t.ok(str.startsWith('  Error: Something went wrong'))
})

tap.test('returns string with custom eol', async t => {
  const err = Error('Something went wrong')
  const str = prettifyErrorLog({ log: err, eol: '\r\n' })
  t.ok(str.startsWith('    Error: Something went wrong\r\n'))
})
