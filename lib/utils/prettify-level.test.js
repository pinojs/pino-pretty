'use strict'

const tap = require('tap')
const prettifyLevel = require('./prettify-level')
const getColorizer = require('../colors')

tap.test('returns `undefined` for unknown level', async t => {
  const colorized = prettifyLevel({ log: {} })
  t.equal(colorized, undefined)
})

tap.test('returns non-colorized value for default colorizer', async t => {
  const log = {
    level: 30
  }
  const colorized = prettifyLevel({ log })
  t.equal(colorized, 'INFO')
})

tap.test('returns colorized value for color colorizer', async t => {
  const log = {
    level: 30
  }
  const colorizer = getColorizer(true)
  const colorized = prettifyLevel({ log, colorizer })
  t.equal(colorized, '\u001B[32mINFO\u001B[39m')
})
