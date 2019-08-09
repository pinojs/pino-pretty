const LogProcessor = require('../LogProcessor')
const defaultColorizer = require('../colors')()

/**
 * Checks if the passed in `input` object has a `level` value and returns a prettified
 * string for that level if so.
 *
 * @param {object} input The log object which should have a `level` property.
 * @param {object} context The `context` object which should have a `colorizer` property.
 * @param {function} [context.colorizer] A colorizer function that accepts a level
 * value and returns a colorized string. Default: a no-op colorizer.
 *
 * @returns {undefined|string} If `input` does not have a `level` property then
 * `undefined` will be returned. Otherwise, a string from the specified
 * `colorizer` is returned.
 */
function prettifyLevel (input, { prettified, colorizer = defaultColorizer } = {}) {
  if ('level' in input === false) return undefined
  const colorized = colorizer(input.level)
  prettified.prettifiedLevel = colorized
  return undefined
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
