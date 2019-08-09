'use strict'

const chalk = require('chalk')
const colors = require('./lib/colors')
const { ERROR_LIKE_KEYS, MESSAGE_KEY, TIMESTAMP_KEY } = require('./lib/constants')

const {
  defaultLogParsingSequence,
  createLogProcessor,
  parseInput,
  buildLine,
  State
} = require('./lib/log-processors')
const { JsonLogProcessor } = require('./lib/processors/JsonLogProcessor')

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
    const logProcessors = definitions.map(definition => createLogProcessor(definition))

    this.logParsers = logProcessors.filter(logProcessor => !!logProcessor.parse)
    this.lineBuilders = logProcessors.filter(logProcessor => !!logProcessor.build)
  }

  prettify (inputData) {
    const { context, logParsers, lineBuilders } = this
    const state = new State()

    const output = parseInput(logParsers, context, inputData, state)
    if (state.stopped) {
      return output
    }

    context.log = output

    const line = buildLine(lineBuilders, context)
    return line
  }
}

module.exports = function prettyFactory (options) {
  const prettifier = new Prettifier(options)
  return (inputData) => prettifier.prettify(inputData)
}
