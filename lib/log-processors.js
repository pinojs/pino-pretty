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
const { ObjectOrErrorLogProcessor } = require('./processors/ObjectOrErrorLogProcessor')

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
  objectOrError: ObjectOrErrorLogProcessor
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
  builtInLogProcessors.objectOrError
]

module.exports = {
  builtInLogProcessors,
  defaultLogParsingSequence,
  createLogProcessor
}
