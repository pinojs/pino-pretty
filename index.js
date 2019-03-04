'use strict'

const chalk = require('chalk')
const jmespath = require('jmespath')
const colors = require('./lib/colors')
const path = require('path')
const { ERROR_LIKE_KEYS, MESSAGE_KEY, TIMESTAMP_KEY } = require('./lib/constants')
const {
  isObject,
  prettifyErrorLog,
  prettifyLevel,
  prettifyMessage,
  prettifyMetadata,
  prettifyObject,
  prettifyTime
} = require('./lib/utils')

const bourne = require('@hapi/bourne')
const jsonParser = input => {
  try {
    return { value: bourne.parse(input, { protoAction: 'remove' }) }
  } catch (err) {
    return { err }
  }
}

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
  outputStream: process.stdout,
  optionsFile: path.join(process.cwd(), '.pino-prettyrc.json')
}

module.exports = function prettyFactory (options) {
  const opts = Object.assign({}, defaultOptions, options)
  try {
    const runConfiguration = require(opts.optionsFile)
    Object.assign(opts, runConfiguration)
  } catch (error) {
    // Only throw an error if the options file path is not the default
    if (defaultOptions.optionsFile !== opts.optionsFile) {
      throw new Error('Failed to load runtime configuration file [' + opts.optionsFile + ']')
    }
  }
  const EOL = opts.crlf ? '\r\n' : '\n'
  const IDENT = '    '
  const messageKey = opts.messageKey
  const timestampKey = opts.timestampKey
  const errorLikeObjectKeys = opts.errorLikeObjectKeys
  const errorProps = opts.errorProps.split(',')
  const ignoreKeys = opts.ignore ? new Set(opts.ignore.split(',')) : undefined

  const colorizer = colors(opts.colorize)
  const search = opts.search

  return pretty

  function pretty (inputData) {
    let log
    if (!isObject(inputData)) {
      const parsed = jsonParser(inputData)
      if (parsed.err || !isObject(parsed.value)) {
        // pass through
        return inputData + EOL
      }
      log = parsed.value
    } else {
      log = inputData
    }

    // Short-circuit for spec allowed primitive values.
    if ([null, true, false].includes(log) || Number.isFinite(log)) {
      return `${log}\n`
    }

    if (search && !jmespath.search(log, search)) {
      return
    }

    if (ignoreKeys) {
      log = Object.keys(log)
        .filter(key => !ignoreKeys.has(key))
        .reduce((res, key) => {
          res[key] = log[key]
          return res
        }, {})
    }

    const prettifiedLevel = prettifyLevel({ log, colorizer })
    const prettifiedMessage = prettifyMessage({ log, messageKey, colorizer })
    const prettifiedMetadata = prettifyMetadata({ log })
    const prettifiedTime = prettifyTime({ log, translateFormat: opts.translateTime, timestampKey })

    let line = ''
    if (opts.levelFirst && prettifiedLevel) {
      line = `${prettifiedLevel}`
    }

    if (prettifiedTime && line === '') {
      line = `${prettifiedTime}`
    } else if (prettifiedTime) {
      line = `${line} ${prettifiedTime}`
    }

    if (!opts.levelFirst && prettifiedLevel) {
      if (line.length > 0) {
        line = `${line} ${prettifiedLevel}`
      } else {
        line = prettifiedLevel
      }
    }

    if (prettifiedMetadata) {
      line = `${line} ${prettifiedMetadata}:`
    }

    if (line.endsWith(':') === false && line !== '') {
      line += ':'
    }

    if (prettifiedMessage) {
      line = `${line} ${prettifiedMessage}`
    }

    if (line.length > 0) {
      line += EOL
    }

    if (log.type === 'Error' && log.stack) {
      const prettifiedErrorLog = prettifyErrorLog({
        log,
        errorLikeKeys: errorLikeObjectKeys,
        errorProperties: errorProps,
        ident: IDENT,
        eol: EOL
      })
      line += prettifiedErrorLog
    } else {
      const skipKeys = typeof log[messageKey] === 'string' ? [messageKey] : undefined
      const prettifiedObject = prettifyObject({
        input: log,
        skipKeys,
        errorLikeKeys: errorLikeObjectKeys,
        eol: EOL,
        ident: IDENT
      })
      line += prettifiedObject
    }

    return line
  }
}
