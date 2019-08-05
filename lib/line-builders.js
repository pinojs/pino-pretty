'use strict'

const {
  prettifyErrorLog,
  prettifyObject
} = require('./utils')

const lineBuilders = [
  (lineParts, { prettified, opts }) => {
    const { prettifiedLevel } = prettified
    if (opts.levelFirst && prettifiedLevel) {
      lineParts.push(prettifiedLevel)
    }
  },
  (lineParts, { prettified }) => {
    const { prettifiedTime } = prettified
    if (prettifiedTime) {
      if (lineParts.length > 0) {
        lineParts.push(' ')
      }
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
  (lineParts, { log, EOL, IDENT, opts }) => {
    const { errorLikeObjectKeys, errorProps, messageKey } = opts
    const errorProperties = errorProps.split(',')

    if (log.type === 'Error' && log.stack) {
      const prettifiedErrorLog = prettifyErrorLog({
        log,
        errorLikeKeys: errorLikeObjectKeys,
        errorProperties,
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

function buildLine (context) {
  let lineParts = []

  for (const lineBuilder of lineBuilders) {
    lineBuilder(lineParts, context)
  }

  let line = lineParts.join('') || ''
  return line
}

module.exports = {
  lineBuilders,
  buildLine
}
