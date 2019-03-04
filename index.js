'use strict'

const chalk = require('chalk')
const dateformat = require('dateformat')
// remove jsonParser once Node 6 is not supported anymore
const jsonParser = require('fast-json-parse')
const jmespath = require('jmespath')
const stringifySafe = require('fast-safe-stringify')

const CONSTANTS = require('./lib/constants')

const levels = {
  default: 'USERLVL',
  60: 'FATAL',
  50: 'ERROR',
  40: 'WARN ',
  30: 'INFO ',
  20: 'DEBUG',
  10: 'TRACE'
}

const defaultOptions = {
  colorize: chalk.supportsColor,
  crlf: false,
  errorLikeObjectKeys: ['err', 'error'],
  errorProps: '',
  levelFirst: false,
  messageKey: CONSTANTS.MESSAGE_KEY,
  translateTime: false,
  useMetadata: false,
  outputStream: process.stdout
}

function isObject (input) {
  return Object.prototype.toString.apply(input) === '[object Object]'
}

function isPinoLog (log) {
  return log && (log.hasOwnProperty('v') && log.v === 1)
}

function formatTime (epoch, translateTime) {
  const instant = new Date(epoch)
  if (translateTime === true) {
    return dateformat(instant, 'UTC:' + CONSTANTS.DATE_FORMAT)
  } else {
    const upperFormat = translateTime.toUpperCase()
    return (!upperFormat.startsWith('SYS:'))
      ? dateformat(instant, 'UTC:' + translateTime)
      : (upperFormat === 'SYS:STANDARD')
        ? dateformat(instant, CONSTANTS.DATE_FORMAT)
        : dateformat(instant, translateTime.slice(4))
  }
}

function nocolor (input) {
  return input
}

module.exports = function prettyFactory (options) {
  const opts = Object.assign({}, defaultOptions, options)
  const EOL = opts.crlf ? '\r\n' : '\n'
  const IDENT = '    '
  const messageKey = opts.messageKey
  const errorLikeObjectKeys = opts.errorLikeObjectKeys
  const errorProps = opts.errorProps.split(',')

  const color = {
    default: nocolor,
    60: nocolor,
    50: nocolor,
    40: nocolor,
    30: nocolor,
    20: nocolor,
    10: nocolor,
    message: nocolor
  }
  if (opts.colorize) {
    const ctx = new chalk.constructor({ enabled: true, level: 3 })
    color.default = ctx.white
    color[60] = ctx.bgRed
    color[50] = ctx.red
    color[40] = ctx.yellow
    color[30] = ctx.green
    color[20] = ctx.blue
    color[10] = ctx.grey
    color.message = ctx.cyan
  }

  const search = opts.search

  return pretty

  function pretty (inputData) {
    let log
    if (!isObject(inputData)) {
      const parsed = jsonParser(inputData)
      log = parsed.value
      if (parsed.err || !isPinoLog(log)) {
        // pass through
        return inputData + EOL
      }
    } else {
      log = inputData
    }

    if (search && !jmespath.search(log, search)) {
      return
    }

    let tokens = [
      { delimiter: '[', requireAllKeys: ['time'] },
      { key: 'time' },
      { delimiter: '] ', requireAllKeys: ['time'] },
      { key: 'level' }
    ]

    let swapTimeTokens = [
      { key: 'level' },
      { delimiter: ' [', requireAllKeys: ['time'] },
      { key: 'time' },
      { delimiter: ']', requireAllKeys: ['time'] }
    ]

    if (opts.format) {
      tokens = opts.format
    } else {
      if (opts.levelFirst) {
        tokens = swapTimeTokens
      }
      tokens.push({ delimiter: ' (', requireOneOfKeys: ['name', 'pid', 'hostname'] })
      tokens.push({ key: 'name' })
      tokens.push({ delimiter: '/', requireAllKeys: ['name', 'pid'] })
      tokens.push({ key: 'pid' })
      tokens.push({ delimiter: ' on ', requireAllKeys: ['hostname'] })
      tokens.push({ key: 'hostname' })
      tokens.push({ delimiter: ')', requireOneOfKeys: ['name', 'pid', 'hostname'] })
      tokens.push({ delimiter: ': ' })
    }

    var line = ''
    let standardKeys = []
    if (opts.ignoreKeys) {
      standardKeys = opts.ignoreKeys
    } else {
      standardKeys = [
        'v'
      ]
    }

    // Iterate through all tokens to generate the first line
    tokens.forEach((token) => {
      // If the token is a key and the key exists on the log
      if (token.key && log.hasOwnProperty(token.key)) {
        // Push the key into standard keys so it's not output in subsequent lines
        standardKeys.push(token.key)
        switch (token.key) {
          case 'time':
            if (log.time) {
              if (opts.translateTime) {
                line += formatTime(log.time, opts.translateTime)
              } else {
                line += log.time
              }
            }
            break
          case 'level':
            const coloredLevel = levels.hasOwnProperty(log.level)
              ? color[log.level](levels[log.level])
              : color.default(levels.default)
            line += coloredLevel
            break
          default:
            if (log.hasOwnProperty(token.key)) {
              line += log[token.key]
            }
        }
      } else if (token.delimiter) {
        if (token.requireOneOfKeys) {
          // Validate that at least one of the keys is available
          for (var i = 0; i < token.requireOneOfKeys.length; i++) {
            if (log.hasOwnProperty(token.requireOneOfKeys[i])) {
              line += token.delimiter
              break
            }
          }
        } else if (token.requireAllKeys) {
          // Validate that all of the keys are available
          if (token.requireAllKeys.every(item => log.hasOwnProperty(item))) {
            line += token.delimiter
          }
        } else {
          line += token.delimiter
        }
      }
    })

    if (log[messageKey] && typeof log[messageKey] === 'string') {
      line += color.message(log[messageKey])
    }

    line += EOL

    if (log.type === 'Error' && log.stack) {
      const stack = log.stack
      line += IDENT + joinLinesWithIndentation(stack) + EOL

      let propsForPrint
      if (errorProps && errorProps.length > 0) {
        // don't need print these props for 'Error' object
        const excludedProps = standardKeys.concat([messageKey, 'type', 'stack'])

        if (errorProps[0] === '*') {
          // print all log props excluding 'excludedProps'
          propsForPrint = Object.keys(log).filter((prop) => excludedProps.indexOf(prop) < 0)
        } else {
          // print props from 'errorProps' only
          // but exclude 'excludedProps'
          propsForPrint = errorProps.filter((prop) => excludedProps.indexOf(prop) < 0)
        }

        for (var i = 0; i < propsForPrint.length; i++) {
          const key = propsForPrint[i]
          if (!log.hasOwnProperty(key)) continue
          if (log[key] instanceof Object) {
            // call 'filterObjects' with 'excludeStandardKeys' = false
            // because nested property might contain property from 'standardKeys'
            line += key + ': {' + EOL + filterObjects(log[key], '', errorLikeObjectKeys, false) + '}' + EOL
            continue
          }
          line += key + ': ' + log[key] + EOL
        }
      }
    } else {
      line += filterObjects(log, typeof log[messageKey] === 'string' ? messageKey : undefined, errorLikeObjectKeys)
    }

    return line

    function joinLinesWithIndentation (value) {
      const lines = value.split(/\r?\n/)
      for (var i = 1; i < lines.length; i++) {
        lines[i] = IDENT + lines[i]
      }
      return lines.join(EOL)
    }

    function filterObjects (value, messageKey, errorLikeObjectKeys, excludeStandardKeys) {
      errorLikeObjectKeys = errorLikeObjectKeys || []

      const keys = Object.keys(value)
      const filteredKeys = []

      if (messageKey) {
        filteredKeys.push(messageKey)
      }

      if (excludeStandardKeys !== false) {
        Array.prototype.push.apply(filteredKeys, standardKeys)
      }

      let result = ''

      for (var i = 0; i < keys.length; i += 1) {
        if (errorLikeObjectKeys.indexOf(keys[i]) !== -1 && value[keys[i]] !== undefined) {
          const lines = stringifySafe(value[keys[i]], null, 2)
          if (lines === undefined) continue
          const arrayOfLines = (
            IDENT + keys[i] + ': ' +
            joinLinesWithIndentation(lines) +
            EOL
          ).split('\n')

          for (var j = 0; j < arrayOfLines.length; j += 1) {
            if (j !== 0) {
              result += '\n'
            }

            const line = arrayOfLines[j]

            if (/^\s*"stack"/.test(line)) {
              const matches = /^(\s*"stack":)\s*(".*"),?$/.exec(line)

              if (matches && matches.length === 3) {
                const indentSize = /^\s*/.exec(line)[0].length + 4
                const indentation = ' '.repeat(indentSize)

                result += matches[1] + '\n' + indentation + JSON.parse(matches[2]).replace(/\n/g, '\n' + indentation)
              }
            } else {
              result += line
            }
          }
        } else if (filteredKeys.indexOf(keys[i]) < 0) {
          if (value[keys[i]] !== undefined) {
            const lines = stringifySafe(value[keys[i]], null, 2)
            if (lines !== undefined) {
              result += IDENT + keys[i] + ': ' + joinLinesWithIndentation(lines) + EOL
            }
          }
        }
      }

      return result
    }
  }
}
