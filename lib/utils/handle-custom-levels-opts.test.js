'use strict'

const tap = require('tap')
const handleCustomLevelsOpts = require('./handle-custom-levels-opts')

tap.test('returns a empty object `{}` for unknown parameter', async t => {
  const handledCustomLevel = handleCustomLevelsOpts(123)
  t.same(handledCustomLevel, {})
})

tap.test('returns a filled object for string parameter', async t => {
  const handledCustomLevel = handleCustomLevelsOpts('ok:10,warn:20,error:35')
  t.same(handledCustomLevel, {
    10: 'OK',
    20: 'WARN',
    35: 'ERROR',
    default: 'USERLVL'
  })
})

tap.test('returns a filled object for object parameter', async t => {
  const handledCustomLevel = handleCustomLevelsOpts({
    ok: 10,
    warn: 20,
    error: 35
  })
  t.same(handledCustomLevel, {
    10: 'OK',
    20: 'WARN',
    35: 'ERROR',
    default: 'USERLVL'
  })
})
