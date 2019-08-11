'use strict'

const LogProcessor = require('../LogProcessor')

function ignore (input, { ignore }) {
  const ignoreKeys = ignore ? new Set(ignore.split(',')) : undefined
  if (ignoreKeys) {
    const output = Object.keys(input)
      .filter(key => !ignoreKeys.has(key))
      .reduce((res, key) => {
        res[key] = input[key]
        return res
      }, {})
    return output
  } else {
    return input
  }
}

class IgnoreLogProcessor extends LogProcessor {
  parse (input, context) {
    return ignore(input, context)
  }
}

module.exports = {
  IgnoreLogProcessor
}
