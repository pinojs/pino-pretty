'use strict'

const LogProcessor = require('../LogProcessor')

function primitives (input, context, state) {
  // Short-circuit for spec allowed primitive values.
  if ([null, true, false].includes(input) || Number.isFinite(input)) {
    state.stop()
    return `${input}\n`
  } else {
    return input
  }
}

class PrimitivesLogProcessor extends LogProcessor {
  parse (input, context, state) {
    return primitives(input, context, state)
  }
}

module.exports = {
  PrimitivesLogProcessor
}
