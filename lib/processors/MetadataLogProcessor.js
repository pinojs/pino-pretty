const LogProcessor = require('../LogProcessor')

/**
 * Prettifies metadata that is usually present in a Pino log line. It looks for
 * fields `name`, `pid`, and `hostname` and assigns a formatted string using
 * the fields it finds to the `context.prettified.prettifiedMetadata` property.
 *
 * If none of the fields are found, then nothing will happen.
 *
 * @param {object} input The log object that may or may not contain metadata to
 * be prettified.
 *
 * @returns {object} Returns the `input` object unmodified.
 */
function prettifyMetadata (input, { prettified }) {
  if (input.name || input.pid || input.hostname) {
    let line = '('

    if (input.name) {
      line += input.name
    }

    if (input.name && input.pid) {
      line += '/' + input.pid
    } else if (input.pid) {
      line += input.pid
    }

    if (input.hostname) {
      // If `pid` and `name` were in the ignore keys list then we don't need
      // the leading space.
      line += `${line === '(' ? 'on' : ' on'} ${input.hostname}`
    }

    line += ')'

    prettified.prettifiedMetadata = line
  }
  return input
}

function appendMetadata (lineParts, { prettified }) {
  const { prettifiedMetadata } = prettified
  if (prettifiedMetadata) {
    lineParts.push(' ')
    lineParts.push(prettifiedMetadata)
    lineParts.push(':')
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

module.exports = {
  prettifyMetadata,
  MetadataLogProcessor
}
