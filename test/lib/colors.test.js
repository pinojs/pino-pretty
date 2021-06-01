'use strict'

const { test } = require('tap')
const getColorizer = require('../../lib/colors')

test('returns default colorizer', async t => {
  const colorizer = getColorizer()
  let colorized = colorizer(10)
  t.equal(colorized, 'TRACE')

  colorized = colorizer(20)
  t.equal(colorized, 'DEBUG')

  colorized = colorizer(30)
  t.equal(colorized, 'INFO')

  colorized = colorizer(40)
  t.equal(colorized, 'WARN')

  colorized = colorizer(50)
  t.equal(colorized, 'ERROR')

  colorized = colorizer(60)
  t.equal(colorized, 'FATAL')

  colorized = colorizer(900)
  t.equal(colorized, 'USERLVL')

  colorized = colorizer('info')
  t.equal(colorized, 'INFO')

  colorized = colorizer('use-default')
  t.equal(colorized, 'USERLVL')

  colorized = colorizer.message('foo')
  t.equal(colorized, 'foo')

  colorized = colorizer.greyMessage('foo')
  t.equal(colorized, 'foo')
})

test('returns colorizing colorizer', async t => {
  const colorizer = getColorizer(true)
  let colorized = colorizer(10)
  t.equal(colorized, '\u001B[90mTRACE\u001B[39m')

  colorized = colorizer(20)
  t.equal(colorized, '\u001B[34mDEBUG\u001B[39m')

  colorized = colorizer(30)
  t.equal(colorized, '\u001B[32mINFO\u001B[39m')

  colorized = colorizer(40)
  t.equal(colorized, '\u001B[33mWARN\u001B[39m')

  colorized = colorizer(50)
  t.equal(colorized, '\u001B[31mERROR\u001B[39m')

  colorized = colorizer(60)
  t.equal(colorized, '\u001B[41mFATAL\u001B[49m')

  colorized = colorizer(900)
  t.equal(colorized, '\u001B[37mUSERLVL\u001B[39m')

  colorized = colorizer('info')
  t.equal(colorized, '\u001B[32mINFO\u001B[39m')

  colorized = colorizer('use-default')
  t.equal(colorized, '\u001B[37mUSERLVL\u001B[39m')

  colorized = colorizer.message('foo')
  t.equal(colorized, '\u001B[36mfoo\u001B[39m')

  colorized = colorizer.greyMessage('foo')
  t.equal(colorized, '\u001B[90mfoo\u001B[39m')
})
