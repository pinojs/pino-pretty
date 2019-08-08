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

function appendLevel (lineParts, { prettified, levelFirst }) {
  const { prettifiedLevel } = prettified
  if (prettifiedLevel) {
    if (levelFirst) {
      if (lineParts.length > 0) {
        lineParts.unshift(' ')
      }
      lineParts.unshift(prettifiedLevel)
    } else {
      if (lineParts.length > 0) {
        lineParts.push(' ')
      }
      lineParts.push(prettifiedLevel)
    }
  }
}

function appendMetadata (lineParts, { prettified }) {
  const { prettifiedMetadata } = prettified
  if (prettifiedMetadata) {
    lineParts.push(' ')
    lineParts.push(prettifiedMetadata)
    lineParts.push(':')
  }
}

function appendSemicolon (lineParts) {
  if (lineParts.length > 0 && lineParts[lineParts.length - 1] !== ':') {
    lineParts.push(':')
  }
}

function appendMessage (lineParts, { prettified }) {
  const { prettifiedMessage } = prettified
  if (prettifiedMessage) {
    lineParts.push(' ')
    lineParts.push(prettifiedMessage)
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

const lineBuilders = [
  appendTime,
  appendLevel,
  appendMetadata,
  appendSemicolon,
  appendMessage,
  appendEOL,
  appendObjectOrError
]

function buildLine (context) {
  const lineParts = []

  for (let index = 0; index < lineBuilders.length; index++) {
    const lineBuilder = lineBuilders[index]
    lineBuilder(lineParts, context)
  }

  return lineParts.join('')
}

module.exports = {
  lineBuilders,
  buildLine
}
