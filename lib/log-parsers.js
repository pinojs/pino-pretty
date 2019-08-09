'use strict'

function ignore (input, { ignore }) {
  const ignoreKeys = ignore ? new Set(ignore.split(',')) : undefined
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

const builtInLogParsers = {
  ignore
}

module.exports = {
  builtInLogParsers
}
