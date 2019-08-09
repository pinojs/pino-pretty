const jmespath = require('jmespath')

const LogProcessor = require('../LogProcessor')

function search (input, { search }) {
  if (search && !jmespath.search(input, search)) {
    return { output: undefined, done: true }
  } else {
    return { output: input }
  }
}

class SearchLogProcessor extends LogProcessor {
  parse (input, context) {
    return search(input, context)
  }
}

module.exports = {
  SearchLogProcessor
}
