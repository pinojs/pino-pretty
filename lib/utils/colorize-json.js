'use strict'

module.exports = colorizeJson

const defaultJsonColors = {
  BRACE: 'greenBright',
  BRACKET: 'blueBright',
  COLON: 'gray',
  COMMA: 'gray',
  STRING_KEY: 'redBright',
  STRING_LITERAL: 'greenBright',
  NUMBER_LITERAL: 'yellow',
  BOOLEAN_LITERAL: 'cyan',
  NULL_LITERAL: 'white'
}

const TOKEN_TYPES = [
  { regex: /\s+/y, type: 'WHITESPACE' },
  { regex: /[{}]/y, type: 'BRACE' },
  { regex: /[[\]]/y, type: 'BRACKET' },
  { regex: /:/y, type: 'COLON' },
  { regex: /,/y, type: 'COMMA' },
  { regex: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y, type: 'NUMBER_LITERAL' },
  { regex: /"(?:\\.|[^"\\])*"(?=\s*:)/y, type: 'STRING_KEY' },
  { regex: /"(?:\\.|[^"\\])*"/y, type: 'STRING_LITERAL' },
  { regex: /(?:true|false)\b/y, type: 'BOOLEAN_LITERAL' },
  { regex: /null\b/y, type: 'NULL_LITERAL' }
]

/**
 * Colorizes a JSON string using the provided Colorette colors instance.
 *
 * @param {string} input The JSON string to colorize.
 * @param {object} [colorizer] Colorette instance containing color functions.
 *
 * @returns {string} The colorized string.
 */
function colorizeJson (input, colorizer) {
  if (typeof input !== 'string' || input.length === 0) return ''
  if (!colorizer) return input

  let result = ''
  let cursor = 0
  const len = input.length

  while (cursor < len) {
    let matched = false
    for (let i = 0; i < TOKEN_TYPES.length; i++) {
      const { regex, type } = TOKEN_TYPES[i]
      regex.lastIndex = cursor
      const match = regex.exec(input)
      if (match !== null) {
        const val = match[0]
        const colorKey = defaultJsonColors[type]
        const colorFn = colorKey && colorizer[colorKey]
        result += colorFn ? colorFn(val) : val
        cursor += val.length
        matched = true
        break
      }
    }
    if (!matched) {
      result += input[cursor]
      cursor += 1
    }
  }

  return result
}
