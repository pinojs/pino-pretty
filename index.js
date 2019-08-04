'use strict'

const chalk = require('chalk')
const jmespath = require('jmespath')
const colors = require('./lib/colors')
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
  outputStream: process.stdout
}

module.exports = function prettyFactory (options) {
  const opts = Object.assign({}, defaultOptions, options)
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
    const logBuilders = [
      (input) => {
        if (!isObject(input)) {
          const parsed = jsonParser(input)
          if (parsed.err) {
            // pass through
            return { output: input + EOL, done: true }
          } else {
            return { output: parsed.value }
          }
        } else return { output: input }
      },
      (input) => {
        // Short-circuit for spec allowed primitive values.
        if ([null, true, false].includes(input) || Number.isFinite(input)) {
          return { output: `${input}\n`, done: true }
        } else {
          return { output: input }
        }
      },
      (input) => {
        if (search && !jmespath.search(input, search)) {
          return { output: undefined, done: true }
        } else {
          return { output: input }
        }
      },
      (input) => {
        if (ignoreKeys) {
          const output = Object.keys(input)
            .filter(key => !ignoreKeys.has(key))
            .reduce((res, key) => {
              res[key] = input[key]
              return res
            }, {})
          return { output }
        } else {
          return { output: input }
        }
      }
    ]

    let nextInput = inputData

    for (const logBuilder of logBuilders) {
      const result = logBuilder(nextInput)
      if (result.done) {
        return result.output
      } else {
        nextInput = result.output
      }
    }

    let log = nextInput

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
