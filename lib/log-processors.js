'use strict'

const LogProcessor = require('./LogProcessor')
const { JsonLogProcessor } = require('./processors/JsonLogProcessor')
const { PrimitivesLogProcessor } = require('./processors/PrimitivesLogProcessor')
const { SearchLogProcessor } = require('./processors/SearchLogProcessor')
const { IgnoreLogProcessor } = require('./processors/IgnoreLogProcessor')
const { LevelLogProcessor } = require('./processors/LevelLogProcessor')
const { MessageLogProcessor } = require('./processors/MessageLogProcessor')
const { MetadataLogProcessor } = require('./processors/MetadataLogProcessor')
const { SemicolonLogProcessor } = require('./processors/SemicolonLogProcessor')
const { TimeLogProcessor } = require('./processors/TimeLogProcessor')
const { EOLLogProcessor } = require('./processors/EOLLogProcessor')
const { ErrorLogProcessor } = require('./processors/ErrorLogProcessor')
const { ObjectLogProcessor } = require('./processors/ObjectLogProcessor')

function createLogProcessor (definition) {
  if (definition instanceof LogProcessor) {
    return definition
  } else if (typeof definition === 'function' && definition.prototype instanceof LogProcessor) {
    // eslint-disable-next-line new-cap
    return new definition()
  } else if (typeof definition === 'function') {
    return { parse: definition }
  } else if (typeof definition === 'string') {
    return new builtInLogProcessors[definition]()
  } else {
    return definition
  }
}

const builtInLogProcessors = {
  json: JsonLogProcessor,
  primitives: PrimitivesLogProcessor,
  search: SearchLogProcessor,
  ignore: IgnoreLogProcessor,
  time: TimeLogProcessor,
  level: LevelLogProcessor,
  metadata: MetadataLogProcessor,
  semicolon: SemicolonLogProcessor,
  message: MessageLogProcessor,
  eol: EOLLogProcessor,
  error: ErrorLogProcessor,
  object: ObjectLogProcessor
}

const defaultLogParsingSequence = [
  builtInLogProcessors.primitives,
  builtInLogProcessors.search,
  builtInLogProcessors.ignore,
  builtInLogProcessors.time,
  builtInLogProcessors.level,
  builtInLogProcessors.metadata,
  builtInLogProcessors.semicolon,
  builtInLogProcessors.message,
  builtInLogProcessors.eol,
  builtInLogProcessors.error,
  builtInLogProcessors.object
]

class State {
  constructor () {
    this.stopped = false
  }

  stop () {
    this.stopped = true
  }
}

function parseInput (parsers, context, input, state) {
  for (let index = 0; !state.stopped && index < parsers.length; index++) {
    const parser = parsers[index]
    input = parser.parse(input, context, state)
  }

  return input
}

function buildLine (builders, context) {
  const lineParts = []

  for (let index = 0; index < builders.length; index++) {
    const builder = builders[index]
    builder.build(lineParts, context)
  }

  return lineParts.join('')
}

module.exports = {
  builtInLogProcessors,
  defaultLogParsingSequence,
  createLogProcessor,
  parseInput,
  buildLine,
  State
}
