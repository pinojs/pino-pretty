'use strict'

const {
  prettifyErrorLog,
  prettifyObject
} = require('./utils')

function appendTime (lineParts, { prettified }) {
  const { prettifiedTime } = prettified
  if (prettifiedTime) {
    if (lineParts.length > 0) {
      lineParts.push(' ')
    }
    lineParts.push(prettifiedTime)
  }
}

function appendSemicolon (lineParts) {
  if (lineParts.length > 0 && lineParts[lineParts.length - 1] !== ':') {
    lineParts.push(':')
  }
}

function appendEOL (lineParts, { EOL }) {
  if (lineParts.length > 0) {
    lineParts.push(EOL)
  }
}

function appendObjectOrError (lineParts, { log, EOL, IDENT, errorLikeObjectKeys, errorProps, messageKey }) {
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

const builtInLineBuilders = {
  appendTime,
  appendSemicolon,
  appendEOL,
  appendObjectOrError
}

function buildLine (lineBuilders, context) {
  const lineParts = []

  for (let index = 0; index < lineBuilders.length; index++) {
    const lineBuilder = lineBuilders[index]
    lineBuilder.build(lineParts, context)
  }

  return lineParts.join('')
}

module.exports = {
  builtInLineBuilders,
  buildLine
}
