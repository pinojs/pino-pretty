'use strict'

const chalk = require('chalk')
const colors = require('./lib/colors')
const { ERROR_LIKE_KEYS, MESSAGE_KEY, TIMESTAMP_KEY } = require('./lib/constants')
const {
  prettifyErrorLog,
  prettifyLevel,
  prettifyMessage,
  prettifyMetadata,
  prettifyObject,
  prettifyTime
} = require('./lib/utils')

const logBuilders = require('./lib/log-builders')

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

  const colorizer = colors(opts.colorize)

  const context = {
    opts,
    EOL
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
      (lineParts, { EOL }) => {
        if (lineParts.length > 0) {
          lineParts.push(EOL)
        }
      },
      (lineParts, { log, EOL }) => {
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
