const LogProcessor = require('../LogProcessor')
const defaultColorizer = require('../colors')()

const {
  MESSAGE_KEY
} = require('../constants')

/**
 * Prettifies a message string if the given `input` object has a message property.
 *
 * @param {object} input The log object which should have a message property.
 * @param {object} context The `context` object with the message to colorize.
 * @param {string} [context.messageKey='msg'] The property of the `input` that is the
 * message to be prettified.
 * @param {function} [context.colorizer] A colorizer function that has a
 * `.message(str)` method attached to it. This function should return a colorized
 * string which will be the "prettified" message. Default: a no-op colorizer.
 *
 * @returns {undefined|string} If the message key is not found, or the message
 * key is not a string, then `undefined` will be returned. Otherwise, a string
 * that is the prettified message.
 */
function prettifyMessage (input, { prettified, messageKey = MESSAGE_KEY, colorizer = defaultColorizer } = {}) {
  if (messageKey in input === false) return undefined
  if (typeof input[messageKey] !== 'string') return undefined
  const colorized = colorizer.message(input[messageKey])
  prettified.prettifiedMessage = colorized
  return undefined
}

function appendMessage (lineParts, { prettified }) {
  const { prettifiedMessage } = prettified
  if (prettifiedMessage) {
    lineParts.push(' ')
    lineParts.push(prettifiedMessage)
  }
}

class MessageLogProcessor extends LogProcessor {
  parse (input, context) {
    return prettifyMessage(input, context)
  }

  build (lineParts, context) {
    return appendMessage(lineParts, context)
  }
}

module.exports = {
  prettifyMessage,
  MessageLogProcessor
}
