'use strict'

module.exports = prettifyMessage

const {
  LEVELS
} = require('../constants')

const getLogPropertyValue = require('./get-log-property-value')
const getPropertyValue = require('./get-property-value')
const interpretConditionals = require('./interpret-conditionals')
const stripUnsafeControlChars = require('./strip-unsafe-control-chars')

/**
 * @typedef {object} PrettifyMessageParams
 * @property {object} log The log object with the message to colorize.
 * @property {PrettyContext} context The context object built from parsing
 * the options.
 */

/**
 * Prettifies a message string if the given `log` has a message property.
 *
 * @param {PrettifyMessageParams} input
 *
 * @returns {undefined|string} If the message key is not found, or the message
 * key is not a string, then `undefined` will be returned. Otherwise, a string
 * that is the prettified message.
 */
function prettifyMessage ({ log, context }) {
  const {
    colorizer,
    customLevels,
    levelKey,
    levelLabel,
    messageFormat,
    messageKey,
    useOnlyCustomProps
  } = context
  if (messageFormat && typeof messageFormat === 'string') {
    const parsedMessageFormat = interpretConditionals(messageFormat, log)

    const message = String(parsedMessageFormat).replace(
      /{([^{}]+)}/g,
      function (match, p1) {
        // return log level as string instead of int
        let level
        if (p1 === levelLabel && (level = getPropertyValue(log, levelKey)) !== undefined) {
          const condition = useOnlyCustomProps ? customLevels === undefined : customLevels[level] === undefined
          return condition ? LEVELS[level] : customLevels[level]
        }

        // Parse nested key access, e.g. `{keyA.subKeyB}`.
        const value = getPropertyValue(log, p1)
        return value !== undefined ? value : ''
      })
    return colorizer.message(stripUnsafeControlChars(message))
  }
  if (messageFormat && typeof messageFormat === 'function') {
    const msg = messageFormat(log, messageKey, levelLabel, { colors: colorizer.colors })
    return colorizer.message(msg)
  }
  const message = getLogPropertyValue(log, messageKey)
  if (message === undefined) return undefined
  if (typeof message !== 'string' && typeof message !== 'number' && typeof message !== 'boolean') return undefined
  return colorizer.message(stripUnsafeControlChars(message))
}
