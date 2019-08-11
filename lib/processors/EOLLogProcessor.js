'use strict'

const LogProcessor = require('../LogProcessor')

function appendEOL (lineParts, { EOL }) {
  if (lineParts.length > 0) {
    lineParts.push(EOL)
  }
}

class EOLLogProcessor extends LogProcessor {
  build (lineParts, context) {
    return appendEOL(lineParts, context)
  }
}

module.exports = {
  EOLLogProcessor
}
