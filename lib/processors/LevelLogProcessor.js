'use strict'

const LogProcessor = require('../LogProcessor')
const defaultColorizer = require('../colors')()

/**
 * Prettifies a level string if the given `input` object has a `level` property.
 *
 * Checks if the passed in `input` object has a `level` value and assigns a
 * prettified string for that level using the specified `colorizer` to the
 * `context.prettified.prettifiedLevel` property if so.
 *
 * If `input` does not have a `level` property, then nothing will happen.
 *
 * @param {object} input The log object which should have a `level` property.
 * @param {object} context The `context` object which should have a `colorizer` property.
 * @param {function} [context.colorizer] A colorizer function that accepts a level
 * value and returns a colorized string. Default: a no-op colorizer.
 *
 * @returns {undefined|string} Returns the `input` object unmodified.
 */
function prettifyLevel (input, { prettified, colorizer = defaultColorizer } = {}) {
  if ('level' in input) {
    const colorized = colorizer(input.level)
    prettified.prettifiedLevel = colorized
  }
  return input
}

function appendLevel (lineParts, { prettified, levelFirst }) {
  const { prettifiedLevel } = prettified
  if (prettifiedLevel) {
    if (levelFirst) {
      if (lineParts.length > 0) {
        lineParts.unshift(' ')
      }
      lineParts.unshift(prettifiedLevel)
    } else {
      if (lineParts.length > 0) {
        lineParts.push(' ')
      }
      lineParts.push(prettifiedLevel)
    }
  }
}

class LevelLogProcessor extends LogProcessor {
  parse (input, context) {
    return prettifyLevel(input, context)
  }
  build (input, context) {
    return appendLevel(input, context)
  }
}

module.exports = {
  prettifyLevel,
  LevelLogProcessor
}
