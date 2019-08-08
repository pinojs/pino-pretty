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

    this.context = {
      EOL: opts.crlf ? '\r\n' : '\n',
      IDENT: '    ',
      translateFormat: opts.translateTime,
      colorizer: colors(opts.colorize),
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

    const prettifiers = [
      { name: 'prettifiedLevel', prettifier: prettifyLevel },
      { name: 'prettifiedMessage', prettifier: prettifyMessage },
      { name: 'prettifiedMetadata', prettifier: prettifyMetadata },
      { name: 'prettifiedTime', prettifier: prettifyTime }
    ]
    this.prettifiers = prettifiers

    if (opts.lineBuilders) {
      lineBuilders.push(...opts.lineBuilders)
    }
    this.lineBuilders = lineBuilders
  }

  prettify (inputData) {
    let nextInput = inputData

    const { context, logParsers, prettifiers } = this

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

    const prettified = {}
    for (let index = 0; index < prettifiers.length; index++) {
      const { name, prettifier } = prettifiers[index]
      prettified[name] = prettifier(log, context)
    }
    context.prettified = prettified

    context.log = log

    const line = buildLine(context)

    return line
  }
}

module.exports = function prettyFactory (options) {
  const prettifier = new Prettifier(options)
  return (inputData) => prettifier.prettify(inputData)
}
