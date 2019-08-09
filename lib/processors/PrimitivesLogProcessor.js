const LogProcessor = require('../LogProcessor')

function primitives (input) {
  // Short-circuit for spec allowed primitive values.
  if ([null, true, false].includes(input) || Number.isFinite(input)) {
    return { output: `${input}\n`, done: true }
  } else {
    return { output: input }
  }
}

class PrimitivesLogProcessor extends LogProcessor {
  parse (input, context) {
    return primitives(input, context)
  }
}

module.exports = {
  PrimitivesLogProcessor
}
