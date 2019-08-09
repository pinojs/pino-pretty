'use strict'

const builtInLineBuilders = {
}

function buildLine (lineBuilders, context) {
  const lineParts = []

  for (let index = 0; index < lineBuilders.length; index++) {
    const lineBuilder = lineBuilders[index]
    lineBuilder.build(lineParts, context)
  }

  return lineParts.join('')
}

module.exports = {
  builtInLineBuilders,
  buildLine
}
