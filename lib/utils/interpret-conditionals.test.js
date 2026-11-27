'use strict'

const { test } = require('node:test')
const { createCopier } = require('fast-copy')
const fastCopy = createCopier({})
const interpretConditionals = require('./interpret-conditionals')

const logData = {
  level: 30,
  data1: {
    data2: 'bar'
  },
  msg: 'foo'
}

test('interpretConditionals translates if / else statement to found property value', t => {
  const log = fastCopy(logData)
  t.assert.strictEqual(interpretConditionals('{level} - {if data1.data2}{data1.data2}{end}', log), '{level} - bar')
})

test('interpretConditionals translates if / else statement to found property value and leave unmatched property key untouched', t => {
  const log = fastCopy(logData)
  t.assert.strictEqual(interpretConditionals('{level} - {if data1.data2}{data1.data2} ({msg}){end}', log), '{level} - bar ({msg})')
})

test('interpretConditionals removes non-terminated if statements', t => {
  const log = fastCopy(logData)
  t.assert.strictEqual(interpretConditionals('{level} - {if data1.data2}{data1.data2}', log), '{level} - {data1.data2}')
})

test('interpretConditionals removes floating end statements', t => {
  const log = fastCopy(logData)
  t.assert.strictEqual(interpretConditionals('{level} - {data1.data2}{end}', log), '{level} - {data1.data2}')
})

test('interpretConditionals removes floating end statements within translated if / end statements', t => {
  const log = fastCopy(logData)
  t.assert.strictEqual(interpretConditionals('{level} - {if msg}({msg}){end}{end}', log), '{level} - (foo)')
})

test('interpretConditionals removes if / end blocks if existent condition key does not match existent property key', t => {
  const log = fastCopy(logData)
  t.assert.strictEqual(interpretConditionals('{level}{if msg}{data1.data2}{end}', log), '{level}')
})

test('interpretConditionals removes if / end blocks if non-existent condition key does not match existent property key', t => {
  const log = fastCopy(logData)
  t.assert.strictEqual(interpretConditionals('{level}{if foo}{msg}{end}', log), '{level}')
})

test('interpretConditionals removes if / end blocks if existent condition key does not match non-existent property key', t => {
  const log = fastCopy(logData)
  t.assert.strictEqual(interpretConditionals('{level}{if msg}{foo}{end}', log), '{level}')
})

test('interpretConditionals removes if / end blocks if non-existent condition key does not match non-existent property key', t => {
  const log = fastCopy(logData)
  t.assert.strictEqual(interpretConditionals('{level}{if foo}{bar}{end}', log), '{level}')
})

test('interpretConditionals removes if / end blocks if nested condition key does not match property key', t => {
  const log = fastCopy(logData)
  t.assert.strictEqual(interpretConditionals('{level}{if data1.msg}{data1.data2}{end}', log), '{level}')
})

test('interpretConditionals removes nested if / end statement blocks', t => {
  const log = fastCopy(logData)
  t.assert.strictEqual(interpretConditionals('{if msg}{if data1.data2}{msg}{data1.data2}{end}{end}', log), 'foo{data1.data2}')
})

test('interpretConditionals preserves newlines in messageFormat', t => {
  const log = fastCopy(logData)
  t.assert.strictEqual(interpretConditionals('{msg}\n{level}', log), '{msg}\n{level}')
})

test('interpretConditionals preserves newlines with conditionals', t => {
  const log = fastCopy(logData)
  t.assert.strictEqual(interpretConditionals('{msg}{if data1.data2}\n{data1.data2}{end}', log), '{msg}\nbar')
})

test('interpretConditionals removes empty lines from removed conditionals', t => {
  const log = fastCopy(logData)
  t.assert.strictEqual(interpretConditionals('{msg}\n{if foo}{foo}{end}\n{level}', log), '{msg}\n{level}')
})

test('interpretConditionals does not interpret `$` sequences in the property value', t => {
  const log = { msg: 'a $& b' }
  t.assert.strictEqual(interpretConditionals('{if msg}{msg}{end}', log), 'a $& b')
})

test('interpretConditionals preserves every `$` replacement pattern in the property value', t => {
  for (const msg of ['$$', '$&', '$`', "$'", '$1', '$<name>', '100$$']) {
    const log = { msg }
    t.assert.strictEqual(interpretConditionals('{if msg}{msg}{end}', log), msg)
  }
})

test('interpretConditionals does not treat the property key as a regular expression', t => {
  const log = { 'we(ird': 'value' }
  t.assert.strictEqual(interpretConditionals('{if we(ird}{we(ird}{end}', log), 'value')
})

test('interpretConditionals matches the delimiter in a nested key literally', t => {
  const log = { data1: { data2: 'bar' } }
  t.assert.strictEqual(
    interpretConditionals('{if data1.data2}{data1.data2} {data1Xdata2}{end}', log),
    'bar {data1Xdata2}'
  )
})
