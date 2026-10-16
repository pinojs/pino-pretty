'use strict'

/* eslint-disable no-control-regex */

const { test } = require('node:test')
const { createColors } = require('colorette')
const colorizeJson = require('./colorize-json')

const colors = createColors({ useColor: true })
const noColors = createColors({ useColor: false })

test('returns empty string for non-string or empty input', t => {
  t.assert.strictEqual(colorizeJson('', colors), '')
  t.assert.strictEqual(colorizeJson(null, colors), '')
  t.assert.strictEqual(colorizeJson(undefined, colors), '')
  t.assert.strictEqual(colorizeJson(123, colors), '')
})

test('returns input unchanged when colorizer is omitted', t => {
  const json = '{"a":1}'
  t.assert.strictEqual(colorizeJson(json), json)
})

test('highlights all JSON token types with colors enabled', t => {
  const json = '{"str":"hello","num":42,"neg":-3.14,"exp":1e5,"bool":true,"nil":null,"arr":[1,false]}'
  const colored = colorizeJson(json, colors)

  // String keys are redBright
  t.assert.ok(colored.includes(colors.redBright('"str"')))
  t.assert.ok(colored.includes(colors.redBright('"num"')))
  // String values are greenBright
  t.assert.ok(colored.includes(colors.greenBright('"hello"')))
  // Numbers are yellow
  t.assert.ok(colored.includes(colors.yellow('42')))
  t.assert.ok(colored.includes(colors.yellow('-3.14')))
  t.assert.ok(colored.includes(colors.yellow('1e5')))
  // Booleans are cyan
  t.assert.ok(colored.includes(colors.cyan('true')))
  t.assert.ok(colored.includes(colors.cyan('false')))
  // Null is white
  t.assert.ok(colored.includes(colors.white('null')))
  // Braces are greenBright
  t.assert.ok(colored.includes(colors.greenBright('{')))
  t.assert.ok(colored.includes(colors.greenBright('}')))
  // Brackets are blueBright
  t.assert.ok(colored.includes(colors.blueBright('[')))
  t.assert.ok(colored.includes(colors.blueBright(']')))
  // Colons and commas are gray
  t.assert.ok(colored.includes(colors.gray(':')))
  t.assert.ok(colored.includes(colors.gray(',')))

  // Stripped ANSI matches clean JSON
  t.assert.strictEqual(colored.replace(/\u001B\[\d+m/g, ''), json)
})

test('produces zero ANSI escape codes with useColor: false', t => {
  const json = '{"str":"hello","num":42,"bool":true,"nil":null,"arr":[1]}'
  const uncolored = colorizeJson(json, noColors)
  t.assert.strictEqual(/\u001B\[\d+m/.test(uncolored), false)
  t.assert.strictEqual(uncolored, json)
})

test('preserves unrecognized characters without dropping remaining content', t => {
  const relaxed = '{"key": "value", UNRECOGNIZED_TOKEN, "next": 123}'
  const result = colorizeJson(relaxed, colors)

  t.assert.ok(result.includes('UNRECOGNIZED_TOKEN'))
  t.assert.ok(result.includes(colors.redBright('"next"')))
  t.assert.ok(result.includes(colors.yellow('123')))
  t.assert.strictEqual(result.replace(/\u001B\[\d+m/g, ''), relaxed)
})

test('handles escaped quotes and backslashes properly', t => {
  const json = '{"quote":"hello \\"world\\"","path":"C:\\\\Users\\\\test"}'
  const colored = colorizeJson(json, colors)

  t.assert.ok(colored.includes(colors.greenBright('"hello \\"world\\""')))
  t.assert.ok(colored.includes(colors.greenBright('"C:\\\\Users\\\\test"')))
  t.assert.strictEqual(colored.replace(/\u001B\[\d+m/g, ''), json)
})

test('respects token boundaries and does not mis-tokenize keywords or numbers', t => {
  const json = '{"str":"true false null","val":-0,"posExp":1.2e+5,"negExp":-3e-4}'
  const colored = colorizeJson(json, colors)

  // Words inside strings remain greenBright string literals
  t.assert.ok(colored.includes(colors.greenBright('"true false null"')))
  // -0 is yellow
  t.assert.ok(colored.includes(colors.yellow('-0')))
  // Exponents with + and - are yellow
  t.assert.ok(colored.includes(colors.yellow('1.2e+5')))
  t.assert.ok(colored.includes(colors.yellow('-3e-4')))
  t.assert.strictEqual(colored.replace(/\u001B\[\d+m/g, ''), json)

  // Identifiers starting with true/false/null are not mis-tokenized as keywords
  const relaxed = '{trueStory: 123abc, nullify: falsehood}'
  const relaxedColored = colorizeJson(relaxed, colors)
  t.assert.ok(relaxedColored.includes('trueStory'))
  t.assert.ok(relaxedColored.includes('123abc'))
  t.assert.ok(relaxedColored.includes('nullify'))
  t.assert.ok(relaxedColored.includes('falsehood'))
  t.assert.strictEqual(relaxedColored.replace(/\u001B\[\d+m/g, ''), relaxed)
})
