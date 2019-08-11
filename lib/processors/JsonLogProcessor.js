'use strict'

const bourne = require('@hapi/bourne')

const LogProcessor = require('../LogProcessor')
const { isObject } = require('../utils')

const jsonParser = input => {
  try {
    return { value: bourne.parse(input, { protoAction: 'remove' }) }
  } catch (err) {
    return { err }
  }
}

function json (input, { EOL }, state) {
  if (!isObject(input)) {
    const parsed = jsonParser(input)
    if (parsed.err) {
      // pass through
      state.stop()
      return input + EOL
    } else {
      return parsed.value
    }
  } else return input
}

class JsonLogProcessor extends LogProcessor {
  parse (input, context, state) {
    return json(input, context, state)
  }
}

module.exports = {
  JsonLogProcessor
}
