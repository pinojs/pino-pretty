const { builtInLogParsers } = require('./log-parsers')
const { prettifyLevel, prettifyMessage, prettifyMetadata, prettifyTime } = require('./utils')
const { builtInLineBuilders } = require('./line-builders')
const LogProcessor = require('./LogProcessor')
const JsonLogProcessor = require('./processors/JsonLogProcessor')
const PrimitivesLogProcessor = require('./processors/PrimitivesLogProcessor')

const { search, ignore } = builtInLogParsers
const {
  appendLevel,
  appendMessage,
  appendMetadata,
  appendSemicolon,
  appendTime,
  appendEOL,
  appendObjectOrError
} = builtInLineBuilders

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

  build (input, context) {
    return appendLevel(input, context)
  }
}

class MessageLogProcessor extends LogProcessor {
  parse (input, context) {
    return prettifyMessage(input, context)
  }

  build (lineParts, context) {
    return appendMessage(lineParts, context)
  }
}

class MetadataLogProcessor extends LogProcessor {
  parse (input, context) {
    return prettifyMetadata(input, context)
  }

  build (lineParts, context) {
    return appendMetadata(lineParts, context)
  }
}

class SemicolonLogProcessor extends LogProcessor {
  build (lineParts, context) {
    return appendSemicolon(lineParts, context)
  }
}

class TimeLogProcessor extends LogProcessor {
  parse (input, context) {
    return prettifyTime(input, context)
  }

  build (lineParts, context) {
    return appendTime(lineParts, context)
  }
}

class EOLLogProcessor extends LogProcessor {
  build (lineParts, context) {
    return appendEOL(lineParts, context)
  }
}

class ObjectOrErrorLogProcessor extends LogProcessor {
  build (lineParts, context) {
    return appendObjectOrError(lineParts, context)
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
