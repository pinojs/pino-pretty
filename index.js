'use strict'

const chalk = require('chalk')
const colors = require('./lib/colors')
const { ERROR_LIKE_KEYS, MESSAGE_KEY, TIMESTAMP_KEY } = require('./lib/constants')

const { defaultLogParsingSequence, builtInlogParsers } = require('./lib/log-parsers')
const { defaultPrettificationSequence } = require('./lib/utils')
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

    this.context = {
      EOL: opts.crlf ? '\r\n' : '\n',
      IDENT: '    ',
      translateFormat: opts.translateTime,
      colorizer: colors(opts.colorize),
      prettified: {},
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
    logParsers.push(...defaultPrettificationSequence)
    this.logParsers = logParsers

    if (opts.lineBuilders) {
      lineBuilders.push(...opts.lineBuilders)
    }
    this.lineBuilders = lineBuilders
  }

  prettify (inputData) {
    let nextInput = inputData

    const { context, logParsers } = this

    for (let index = 0; index < logParsers.length; index++) {
      const logParser = logParsers[index]
      const result = logParser(nextInput, context)
      if (result) {
        if (result.done) {
          return result.output
        } else {
          nextInput = result.output
        }
      }
    }

    context.log = nextInput

    const line = buildLine(context)

    return line
  }
}

module.exports = function prettyFactory (options) {
  const prettifier = new Prettifier(options)
  return (inputData) => prettifier.prettify(inputData)
}
