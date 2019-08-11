const jmespath = require('jmespath')

const LogProcessor = require('../LogProcessor')

function search (input, { search }, state) {
  if (search && !jmespath.search(input, search)) {
    state.stop()
    return undefined
  } else {
    return input
  }
}

class SearchLogProcessor extends LogProcessor {
  parse (input, context, state) {
    return search(input, context, state)
  }
}

module.exports = {
  SearchLogProcessor
}
