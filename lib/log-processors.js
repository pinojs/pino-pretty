const { builtInLogParsers } = require('./log-parsers')
const { prettifyLevel, prettifyMessage, prettifyMetadata, prettifyTime } = require('./utils')

const { json, primitives, search, ignore } = builtInLogParsers

class LogProcessor {
  parse (input, context) {}
}

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

class JsonLogProcessor extends LogProcessor {
  parse (input, context) {
    return json(input, context)
  }
}

class PrimitivesLogProcessor extends LogProcessor {
  parse (input, context) {
    return primitives(input, context)
  }
}

class SearchLogProcessor extends LogProcessor {
  parse (input, context) {
    return search(input, context)
  }
}

class IgnoreLogProcessor extends LogProcessor {
  parse (input, context) {
    return ignore(input, context)
  }
}

class LevelLogProcessor extends LogProcessor {
  parse (input, context) {
    return prettifyLevel(input, context)
  }
}

class MessageLogProcessor extends LogProcessor {
  parse (input, context) {
    return prettifyMessage(input, context)
  }
}

class MetadataLogProcessor extends LogProcessor {
  parse (input, context) {
    return prettifyMetadata(input, context)
  }
}

class TimeLogProcessor extends LogProcessor {
  parse (input, context) {
    return prettifyTime(input, context)
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
  message: MessageLogProcessor
}

const defaultLogParsingSequence = [
  builtInLogProcessors.primitives,
  builtInLogProcessors.search,
  builtInLogProcessors.ignore,
  builtInLogProcessors.time,
  builtInLogProcessors.level,
  builtInLogProcessors.metadata,
  builtInLogProcessors.message
]

module.exports = {
  builtInLogProcessors,
  defaultLogParsingSequence,
  LogProcessor,
  createLogProcessor,
  JsonLogProcessor
}
