'use strict'

const { test } = require('node:test')
const { prettyFactory } = require('../')

const pretty = prettyFactory({
  colorize: false,
  translateTime: false
})

test('preserves large integer tokens from JSON log lines', t => {
  const output = pretty('{"level":30,"value":1666666666666666700,"msg":"large"}')

  t.assert.match(output, /value: 1666666666666666700\n/)
  t.assert.doesNotMatch(output, /1666666666666666800/)
})

test('preserves negative large integer tokens', t => {
  const output = pretty('{"level":30,"value":-9007199254740993,"msg":"negative"}')

  t.assert.match(output, /value: -9007199254740993\n/)
})

test('keeps safe integers and decimal numbers as numbers', t => {
  const output = pretty('{"level":30,"safe":9007199254740991,"decimal":1.25,"msg":"numbers"}')

  t.assert.match(output, /safe: 9007199254740991\n/)
  t.assert.match(output, /decimal: 1.25\n/)
})

test('preserves large integers in nested objects and arrays', t => {
  const output = pretty('{"level":30,"payload":{"value":1666666666666666700,"items":[-9007199254740993]},"msg":"nested"}')

  t.assert.match(output, /"value": 1666666666666666700/)
  t.assert.match(output, /-9007199254740993/)
})

test('preserves large integers in single-line output', t => {
  const singleLine = prettyFactory({
    colorize: false,
    translateTime: false,
    singleLine: true
  })
  const output = singleLine('{"level":30,"value":1666666666666666700,"msg":"single"}')

  t.assert.match(output, /"value":1666666666666666700/)
})

test('serializes BigInt values supplied as objects', t => {
  const output = pretty({
    level: 30,
    value: BigInt('1666666666666666700'),
    msg: 'direct'
  })

  t.assert.match(output, /value: 1666666666666666700\n/)
})
