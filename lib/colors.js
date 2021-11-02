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
const availableColors = createColors({ useColor: true })
const { white, bgRed, red, yellow, green, blue, gray, cyan } = availableColors

let colored = {
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

function setCustomColors (customColors) {
  colored = customColors.reduce(
    function (agg, [level, color]) {
      agg[level] = availableColors[color]

      return agg
    },
    { default: white, message: cyan, greyMessage: gray }
  )
}

function colorizeLevel (level, colorizer, { customLevels, customLevelNames } = {}) {
  const levels = customLevels || LEVELS
  const levelNames = customLevelNames || LEVEL_NAMES

  if (Number.isInteger(+level)) {
    return Object.prototype.hasOwnProperty.call(levels, level)
      ? colorizer[level](levels[level])
      : colorizer.default(levels.default)
  }
  const levelNum =  Object.prototype.hasOwnProperty.call(levelNames, level.toLowerCase()) ? levelNames[level.toLowerCase()] : 'default'
  return colorizer[levelNum](levels[levelNum])
}

function plainColorizer (level, opts) {
  return colorizeLevel(level, plain, opts)
}
plainColorizer.message = plain.message
plainColorizer.greyMessage = plain.greyMessage

function coloredColorizer (level, opts) {
  return colorizeLevel(level, colored, opts)
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
module.exports = function getColorizer (useColors = false, customColors) {
  if (customColors !== undefined) setCustomColors(customColors)

  return useColors ? coloredColorizer : plainColorizer
}
