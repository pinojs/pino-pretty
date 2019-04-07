'use strict'

const tap = require('tap')
const getColorizer = require('../../lib/colors')
const utils = require('../../lib/utils')

tap.test('prettifyLevel', t => {
  t.test('returns `undefined` for unknown level', async t => {
    const colorized = utils.prettifyLevel({log: {}})
    t.is(colorized, undefined)
  })

  t.test('returns non-colorized value for default colorizer', async t => {
    const log = {
      level: 30
    }
    const colorized = utils.prettifyLevel({log})
    t.is(colorized, 'INFO ')
  })

  t.test('returns colorized value for color colorizer', async t => {
    const log = {
      level: 30
    }
    const colorizer = getColorizer(true)
    const colorized = utils.prettifyLevel({log, colorizer})
    t.is(colorized, '\u001B[32mINFO \u001B[39m')
  })

  t.end()
})
