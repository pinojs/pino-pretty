'use strict'

module.exports = prettifyLevel

const {
  LEVEL_KEY
} = require('../constants')
const defaultColorizer = require('../colors')()

const getPropertyValue = require('./get-property-value')

/**
 * Checks if the passed in log has a `level` value and returns a prettified
 * string for that level if so.
 *
 * @param {object} input
 * @param {object} input.log The log object.
 * @param {function} [input.colorizer] A colorizer function that accepts a level
 * value and returns a colorized string. Default: a no-op colorizer.
 * @param {string} [input.levelKey='level'] The key to find the level under.
 * @param {function} [input.prettifier] A user-supplied formatter to be called instead of colorizer.
 * @param {object} [input.customLevels] The custom levels where key as the level index and value as the level name.
 * @param {object} [input.customLevelNames] The custom level names where key is the level name and value is the level index.
 *
 * @returns {undefined|string} If `log` does not have a `level` property then
 * `undefined` will be returned. Otherwise, a string from the specified
 * `colorizer` is returned.
 */
function prettifyLevel ({
  log,
  colorizer = defaultColorizer,
  levelKey = LEVEL_KEY,
  prettifier,
  customLevels,
  customLevelNames
}) {
  const output = getPropertyValue(log, levelKey)
  if (output === undefined) return undefined
  return prettifier ? prettifier(output) : colorizer(output, { customLevels, customLevelNames })
}
