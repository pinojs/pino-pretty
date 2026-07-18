'use strict'

const { test } = require('node:test')
const stringifySafe = require('fast-safe-stringify')
const prettifyError = require('./prettify-error')

test('prettifies error', t => {
  const error = Error('Bad error!')
  const lines = stringifySafe(error, Object.getOwnPropertyNames(error), 2)

  const prettyError = prettifyError({ keyName: 'errorKey', lines, ident: '    ', eol: '\n' })
  t.assert.match(prettyError, /\s*errorKey: {\n\s*"stack":[\s\S]*"message": "Bad error!"/)
})

test('strips unsafe control characters from an error stack', t => {
  const lines = stringifySafe({
    stack: 'Error: bad\u001B[2J\n    at location\u009B[3J',
    message: 'bad'
  }, null, 2)

  const prettyError = prettifyError({ keyName: 'errorKey', lines, ident: '    ', eol: '\n' })
  t.assert.strictEqual(prettyError.includes('\u001B'), false)
  t.assert.strictEqual(prettyError.includes('\u009B'), false)
  t.assert.match(prettyError, /Error: bad\[2J\n\s+at location\[3J/)
})
