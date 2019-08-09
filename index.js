'use strict'

const chalk = require('chalk')
const colors = require('./lib/colors')
const { ERROR_LIKE_KEYS, MESSAGE_KEY, TIMESTAMP_KEY } = require('./lib/constants')

const {
  defaultLogParsingSequence,
  createLogProcessor,
  JsonLogProcessor
} = require('./lib/log-processors')
const { buildLine, builtInLineBuilders } = require('./lib/line-builders')

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

    const definitions = [new JsonLogProcessor()]
    if (opts.logParsers) {
      definitions.push(...opts.logParsers)
    } else {
      definitions.push(...defaultLogParsingSequence)
    }
    this.logProcessors = definitions.map(definition => createLogProcessor(definition))

    const lineBuilders = builtInLineBuilders
    if (opts.lineBuilders) {
      lineBuilders.push(...opts.lineBuilders)
    }
    this.lineBuilders = lineBuilders
  }

  prettify (inputData) {
    let nextInput = inputData

    const { context, logProcessors, lineBuilders } = this

    for (let index = 0; index < logProcessors.length; index++) {
      const logProcessor = logProcessors[index]
      const result = logProcessor.parse(nextInput, context)
      if (result) {
        if (result.done) {
          return result.output
        } else {
          nextInput = result.output
        }
      }
    }

    context.log = nextInput

    const line = buildLine(lineBuilders, context)

    return line
  }
}

module.exports = function prettyFactory (options) {
  const prettifier = new Prettifier(options)
  return (inputData) => prettifier.prettify(inputData)
}
