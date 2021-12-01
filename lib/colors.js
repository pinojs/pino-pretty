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

function resolveCustomColoredColorizer (customColors) {
  return customColors.reduce(
    function (agg, [level, color]) {
      agg[level] = typeof availableColors[color] === 'function' ? availableColors[color] : white

      return agg
    },
    { default: white, message: cyan, greyMessage: gray }
  )
}

function colorizeLevel (level, colorizer, { customLevels, customLevelNames } = {}) {
  const levels = customLevels || LEVELS
  const levelNames = customLevelNames || LEVEL_NAMES

  let levelNum = 'default'
  if (Number.isInteger(+level)) {
    levelNum = Object.prototype.hasOwnProperty.call(levels, level) ? level : levelNum
  } else {
    levelNum = Object.prototype.hasOwnProperty.call(levelNames, level.toLowerCase()) ? levelNames[level.toLowerCase()] : levelNum
  }

  const levelStr = levels[levelNum]

  return Object.prototype.hasOwnProperty.call(colorizer, levelNum) ? colorizer[levelNum](levelStr) : colorizer.default(levelStr)
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

function customColoredColorizerFactory (customColors) {
  const customColored = resolveCustomColoredColorizer(customColors)

  const customColoredColorizer = function (level, opts) {
    return colorizeLevel(level, customColored, opts)
  }
  customColoredColorizer.message = customColoredColorizer.message || customColored.message
  customColoredColorizer.greyMessage = customColoredColorizer.greyMessage || customColored.greyMessage

  return customColoredColorizer
}

/**
 * Factory function get a function to colorized levels. The returned function
 * also includes a `.message(str)` method to colorize strings.
 *
 * @param {boolean} [useColors=false] When `true` a function that applies standard
 * terminal colors is returned.
 * @param {array[]} [customColors] Touple where first item of each array is the level index and the second item is the color
 *
 * @returns {function} `function (level) {}` has a `.message(str)` method to
 * apply colorization to a string. The core function accepts either an integer
 * `level` or a `string` level. The integer level will map to a known level
 * string or to `USERLVL` if not known.  The string `level` will map to the same
 * colors as the integer `level` and will also default to `USERLVL` if the given
 * string is not a recognized level name.
 */
module.exports = function getColorizer (useColors = false, customColors) {
  if (useColors && customColors !== undefined) {
    return customColoredColorizerFactory(customColors)
  } else if (useColors) {
    return coloredColorizer
  }

  return plainColorizer
}
