'use strict'

const chalk = require('chalk')
const colors = require('./lib/colors')
const { ERROR_LIKE_KEYS, MESSAGE_KEY, TIMESTAMP_KEY } = require('./lib/constants')
const {
  prettifyLevel,
  prettifyMessage,
  prettifyMetadata,
  prettifyTime
} = require('./lib/utils')

const logBuilders = require('./lib/log-builders')
const { buildLine } = require('./lib/line-builders')

const defaultOptions = {
  colorize: chalk.supportsColor,
  crlf: false,
  errorLikeObjectKeys: ERROR_LIKE_KEYS,
  errorProps: '',
  levelFirst: false,
  messageKey: MESSAGE_KEY,
  timestampKey: TIMESTAMP_KEY,
  translateTime: false,
  useMetadata: false,
  outputStream: process.stdout
}

module.exports = function prettyFactory (options) {
  const opts = Object.assign({}, defaultOptions, options)
  const EOL = opts.crlf ? '\r\n' : '\n'
  const IDENT = '    '
  const messageKey = opts.messageKey
  const timestampKey = opts.timestampKey

  const colorizer = colors(opts.colorize)

  const context = {
    opts,
    EOL,
    IDENT
  }

  return pretty

  function pretty (inputData) {
    let nextInput = inputData

    for (const logBuilder of logBuilders) {
      const result = logBuilder(nextInput, context)
      if (result.done) {
        return result.output
      } else {
        nextInput = result.output
      }
    }

    let log = nextInput

    const prettified = {
      prettifiedLevel: prettifyLevel({ log, colorizer }),
      prettifiedMessage: prettifyMessage({ log, messageKey, colorizer }),
      prettifiedMetadata: prettifyMetadata({ log }),
      prettifiedTime: prettifyTime({ log, translateFormat: opts.translateTime, timestampKey })
    }

    context.log = log
    context.prettified = prettified

    let line = buildLine(context)

    return line
  }
}
