'use strict'

const LogProcessor = require('../LogProcessor')

function appendSemicolon (lineParts) {
  if (lineParts.length > 0 && lineParts[lineParts.length - 1] !== ':') {
    lineParts.push(':')
  }
}

class SemicolonLogProcessor extends LogProcessor {
  build (lineParts, context) {
    return appendSemicolon(lineParts, context)
  }
}

module.exports = {
  SemicolonLogProcessor
}
