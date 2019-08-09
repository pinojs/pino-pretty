'use strict'

const jmespath = require('jmespath')

function primitives (input) {
  // Short-circuit for spec allowed primitive values.
  if ([null, true, false].includes(input) || Number.isFinite(input)) {
    return { output: `${input}\n`, done: true }
  } else {
    return { output: input }
  }
}

function search (input, { search }) {
  if (search && !jmespath.search(input, search)) {
    return { output: undefined, done: true }
  } else {
    return { output: input }
  }
}

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
  primitives,
  search,
  ignore
}

module.exports = {
  builtInLogParsers
}
