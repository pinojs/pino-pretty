'use strict'

const jmespath = require('jmespath')

const {
  isObject
} = require('./utils')

const bourne = require('@hapi/bourne')
const jsonParser = input => {
  try {
    return { value: bourne.parse(input, { protoAction: 'remove' }) }
  } catch (err) {
    return { err }
  }
}

function json (input, { EOL }) {
  if (!isObject(input)) {
    const parsed = jsonParser(input)
    if (parsed.err) {
      // pass through
      return { output: input + EOL, done: true }
    } else {
      return { output: parsed.value }
    }
  } else return { output: input }
}

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
  json,
  primitives,
  search,
  ignore
}

module.exports = {
  builtInLogParsers
}
