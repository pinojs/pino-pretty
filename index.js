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

    const prettified = {
      prettifiedLevel: prettifyLevel({ log, colorizer }),
      prettifiedMessage: prettifyMessage({ log, messageKey, colorizer }),
      prettifiedMetadata: prettifyMetadata({ log }),
      prettifiedTime: prettifyTime({ log, translateFormat: opts.translateTime, timestampKey })
    }

    const context = {
      log,
      prettified,
      opts
    }

    const lineBuilders = [
      (lineParts, { prettified, opts }) => {
        const { prettifiedLevel } = prettified
        if (opts.levelFirst && prettifiedLevel) {
          lineParts.push(prettifiedLevel)
        }
      },
      (lineParts, { prettified }) => {
        const { prettifiedTime } = prettified
        if (prettifiedTime && lineParts.length === 0) {
          lineParts.push(prettifiedTime)
        } else if (prettifiedTime) {
          lineParts.push(' ')
          lineParts.push(prettifiedTime)
        }
      },
      (lineParts, { prettified, opts }) => {
        const { prettifiedLevel } = prettified
        if (!opts.levelFirst && prettifiedLevel) {
          if (lineParts.length > 0) {
            lineParts.push(' ')
          }
          lineParts.push(prettifiedLevel)
        }
      },
      (lineParts, { prettified }) => {
        const { prettifiedMetadata } = prettified
        if (prettifiedMetadata) {
          lineParts.push(' ')
          lineParts.push(prettifiedMetadata)
          lineParts.push(':')
        }
      },
      (lineParts) => {
        if (lineParts.length > 0 && lineParts[lineParts.length - 1] !== ':') {
          lineParts.push(':')
        }
      },
      (lineParts, { prettified }) => {
        const { prettifiedMessage } = prettified
        if (prettifiedMessage) {
          lineParts.push(' ')
          lineParts.push(prettifiedMessage)
        }
      },
      (lineParts) => {
        if (lineParts.length > 0) {
          lineParts.push(EOL)
        }
      },
      (lineParts, { log }) => {
        if (log.type === 'Error' && log.stack) {
          const prettifiedErrorLog = prettifyErrorLog({
            log,
            errorLikeKeys: errorLikeObjectKeys,
            errorProperties: errorProps,
            ident: IDENT,
            eol: EOL
          })
          lineParts.push(prettifiedErrorLog)
        } else {
          const skipKeys = typeof log[messageKey] === 'string' ? [messageKey] : undefined
          const prettifiedObject = prettifyObject({
            input: log,
            skipKeys,
            errorLikeKeys: errorLikeObjectKeys,
            eol: EOL,
            ident: IDENT
          })
          lineParts.push(prettifiedObject)
        }
      }
    ]

    let lineParts = []

    for (const lineBuilder of lineBuilders) {
      lineBuilder(lineParts, context)
    }

    let line = lineParts.join('') || ''

    return line
  }
}
