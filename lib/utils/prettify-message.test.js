'use strict'

const tap = require('tap')
const prettifyMessage = require('./prettify-message')
const getColorizer = require('../colors')

tap.test('returns `undefined` if `messageKey` not found', async t => {
  const str = prettifyMessage({ log: {} })
  t.equal(str, undefined)
})

tap.test('returns `undefined` if `messageKey` not string', async t => {
  const str = prettifyMessage({ log: { msg: {} } })
  t.equal(str, undefined)
})

tap.test('returns non-colorized value for default colorizer', async t => {
  const str = prettifyMessage({ log: { msg: 'foo' } })
  t.equal(str, 'foo')
})

tap.test('returns non-colorized value for alternate `messageKey`', async t => {
  const str = prettifyMessage({ log: { message: 'foo' }, messageKey: 'message' })
  t.equal(str, 'foo')
})

tap.test('returns colorized value for color colorizer', async t => {
  const colorizer = getColorizer(true)
  const str = prettifyMessage({ log: { msg: 'foo' }, colorizer })
  t.equal(str, '\u001B[36mfoo\u001B[39m')
})

tap.test('returns colorized value for color colorizer for alternate `messageKey`', async t => {
  const colorizer = getColorizer(true)
  const str = prettifyMessage({ log: { message: 'foo' }, messageKey: 'message', colorizer })
  t.equal(str, '\u001B[36mfoo\u001B[39m')
})

tap.test('returns message formatted by `messageFormat` option', async t => {
  const str = prettifyMessage({ log: { msg: 'foo', context: 'appModule' }, messageFormat: '{context} - {msg}' })
  t.equal(str, 'appModule - foo')
})

tap.test('returns message formatted by `messageFormat` option - missing prop', async t => {
  const str = prettifyMessage({ log: { context: 'appModule' }, messageFormat: '{context} - {msg}' })
  t.equal(str, 'appModule - ')
})

tap.test('returns message formatted by `messageFormat` option - levelLabel & useOnlyCustomProps false', async t => {
  const str = prettifyMessage({ log: { msg: 'foo', context: 'appModule', level: 30 }, messageFormat: '[{level}] {levelLabel} {context} - {msg}', customLevels: {} })
  t.equal(str, '[30] INFO appModule - foo')
})

tap.test('returns message formatted by `messageFormat` option - levelLabel & useOnlyCustomProps true', async t => {
  const str = prettifyMessage({ log: { msg: 'foo', context: 'appModule', level: 30 }, messageFormat: '[{level}] {levelLabel} {context} - {msg}', customLevels: { 30: 'CHECK' }, useOnlyCustomProps: true })
  t.equal(str, '[30] CHECK appModule - foo')
})

tap.test('returns message formatted by `messageFormat` option - levelLabel & customLevels', async t => {
  const str = prettifyMessage({ log: { msg: 'foo', context: 'appModule', level: 123 }, messageFormat: '[{level}] {levelLabel} {context} - {msg}', customLevels: { 123: 'CUSTOM' } })
  t.equal(str, '[123] CUSTOM appModule - foo')
})

tap.test('returns message formatted by `messageFormat` option - levelLabel, customLevels & useOnlyCustomProps', async t => {
  const str = prettifyMessage({ log: { msg: 'foo', context: 'appModule', level: 123 }, messageFormat: '[{level}] {levelLabel} {context} - {msg}', customLevels: { 123: 'CUSTOM' }, useOnlyCustomProps: true })
  t.equal(str, '[123] CUSTOM appModule - foo')
})

tap.test('returns message formatted by `messageFormat` option - levelLabel, customLevels & useOnlyCustomProps false', async t => {
  const str = prettifyMessage({ log: { msg: 'foo', context: 'appModule', level: 40 }, messageFormat: '[{level}] {levelLabel} {context} - {msg}', customLevels: { 123: 'CUSTOM' }, useOnlyCustomProps: false })
  t.equal(str, '[40] WARN appModule - foo')
})

tap.test('`messageFormat` supports nested curly brackets', async t => {
  const str = prettifyMessage({ log: { level: 30 }, messageFormat: '{{level}}-{level}-{{level}-{level}}' })
  t.equal(str, '{30}-30-{30-30}')
})

tap.test('`messageFormat` supports nested object', async t => {
  const str = prettifyMessage({ log: { level: 30, request: { url: 'localhost/test' }, msg: 'foo' }, messageFormat: '{request.url} - param: {request.params.process} - {msg}' })
  t.equal(str, 'localhost/test - param:  - foo')
})

tap.test('`messageFormat` supports conditional blocks', async t => {
  const str = prettifyMessage({ log: { level: 30, req: { id: 'foo' } }, messageFormat: '{level} | {if req.id}({req.id}){end}{if msg}{msg}{end}' })
  t.equal(str, '30 | (foo)')
})

tap.test('`messageFormat` supports function definition', async t => {
  const str = prettifyMessage({
    log: { level: 30, request: { url: 'localhost/test' }, msg: 'incoming request' },
    messageFormat: (log, messageKey, levelLabel) => {
      let msg = log[messageKey]
      if (msg === 'incoming request') msg = `--> ${log.request.url}`
      return msg
    }
  })
  t.equal(str, '--> localhost/test')
})
