'use strict'

const { LEVELS, LEVEL_NAMES } = require('./constants')

const nocolor = input => input
const plain = {
  default: nocolor,
  60: nocolor,
  50: nocolor,
  40: nocolor,
  30: nocolor,
  20: nocolor,
  10: nocolor,
  message: nocolor
}

const chalk = require('chalk')
const ctx = new chalk.constructor({ enabled: true, level: 3 })
const colored = {
  default: ctx.white,
  60: ctx.bgRed,
  50: ctx.red,
  40: ctx.yellow,
  30: ctx.green,
  20: ctx.blue,
  10: ctx.grey,
  message: ctx.cyan
}

function colorizeLevel (level, colorizer) {
  if (Number.isInteger(+level)) {
    return LEVELS.hasOwnProperty(level)
      ? colorizer[level](LEVELS[level])
      : colorizer.default(LEVELS.default)
  }
  const levelNum = LEVEL_NAMES[level.toLowerCase()] || 'default'
  return colorizer[levelNum](LEVELS[levelNum])
}

function plainColorizer (level) {
  return colorizeLevel(level, plain)
}
plainColorizer.message = plain.message

function coloredColorizer (level) {
  return colorizeLevel(level, colored)
}
coloredColorizer.message = colored.message

module.exports = function getColorizer (useColors) {
  return useColors ? coloredColorizer : plainColorizer
}
