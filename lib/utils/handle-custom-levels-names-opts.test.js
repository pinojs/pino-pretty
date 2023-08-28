'use strict'

const tap = require('tap')
const handleCustomLevelsNamesOpts = require('./handle-custom-levels-names-opts')

tap.test('returns a empty object `{}` for unknown parameter', async t => {
  const handledCustomLevelNames = handleCustomLevelsNamesOpts(123)
  t.same(handledCustomLevelNames, {})
})

tap.test('returns a filled object for string parameter', async t => {
  const handledCustomLevelNames = handleCustomLevelsNamesOpts('ok:10,warn:20,error:35')
  t.same(handledCustomLevelNames, {
    ok: 10,
    warn: 20,
    error: 35
  })
})

tap.test('returns a filled object for object parameter', async t => {
  const handledCustomLevelNames = handleCustomLevelsNamesOpts({
    ok: 10,
    warn: 20,
    error: 35
  })
  t.same(handledCustomLevelNames, {
    ok: 10,
    warn: 20,
    error: 35
  })
})
