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
  message: nocolor,
  greyMessage: nocolor
}

const { createColors } = require('colorette')
const { white, bgRed, red, yellow, green, blue, gray, cyan } = createColors({ useColor: true })

const colored = {
  default: white,
  60: bgRed,
  50: red,
  40: yellow,
  30: green,
  20: blue,
  10: gray,
  message: cyan,
  greyMessage: gray
}

function colorizeLevel (level, colorizer) {
  if (Number.isInteger(+level)) {
    return Object.prototype.hasOwnProperty.call(LEVELS, level)
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
plainColorizer.greyMessage = plain.greyMessage

function coloredColorizer (level) {
  return colorizeLevel(level, colored)
}
coloredColorizer.message = colored.message
coloredColorizer.greyMessage = colored.greyMessage

/**
 * Factory function get a function to colorized levels. The returned function
 * also includes a `.message(str)` method to colorize strings.
 *
 * @param {boolean} [useColors=false] When `true` a function that applies standard
 * terminal colors is returned.
 *
 * @returns {function} `function (level) {}` has a `.message(str)` method to
 * apply colorization to a string. The core function accepts either an integer
 * `level` or a `string` level. The integer level will map to a known level
 * string or to `USERLVL` if not known.  The string `level` will map to the same
 * colors as the integer `level` and will also default to `USERLVL` if the given
 * string is not a recognized level name.
 */
module.exports = function getColorizer (useColors = false) {
  return useColors ? coloredColorizer : plainColorizer
}
