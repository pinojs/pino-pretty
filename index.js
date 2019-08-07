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

const { defaultLogParsingSequence, builtInlogParsers } = require('./lib/log-parsers')
const { buildLine, lineBuilders } = require('./lib/line-builders')

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

class Prettifier {
  constructor (options) {
    const opts = Object.assign({}, defaultOptions, options)

    this.messageKey = opts.messageKey
    this.timestampKey = opts.timestampKey

    this.colorizer = colors(opts.colorize)

    this.context = {
      EOL: opts.crlf ? '\r\n' : '\n',
      IDENT: '    ',
      ...opts
    }

    const logParsers = [builtInlogParsers.json]
    if (opts.logParsers) {
      for (let index = 0; index < opts.logParsers.length; index++) {
        const item = opts.logParsers[index]
        const logParser = typeof item === 'string' ? builtInlogParsers[item] : item
        logParsers.push(logParser)
      }
    } else {
      logParsers.push(...defaultLogParsingSequence)
    }
    this.logParsers = logParsers

    if (opts.lineBuilders) {
      lineBuilders.push(...opts.lineBuilders)
    }
    this.lineBuilders = lineBuilders
  }

  prettify (inputData) {
    let nextInput = inputData

    const { context, colorizer, logParsers } = this

    for (let index = 0; index < logParsers.length; index++) {
      const logParser = logParsers[index]
      const result = logParser(nextInput, this.context)
      if (result) {
        if (result.done) {
          return result.output
        } else {
          nextInput = result.output
        }
      }
    }

    const log = nextInput

    const { messageKey, timestampKey } = context

    const prettified = {
      prettifiedLevel: prettifyLevel({ log, colorizer }),
      prettifiedMessage: prettifyMessage({ log, messageKey, colorizer }),
      prettifiedMetadata: prettifyMetadata({ log }),
      prettifiedTime: prettifyTime({ log, translateFormat: context.translateTime, timestampKey })
    }

    context.log = log
    context.prettified = prettified

    const line = buildLine(context)

    return line
  }
}

module.exports = function prettyFactory (options) {
  const prettifier = new Prettifier(options)
  return (inputData) => prettifier.prettify(inputData)
}
