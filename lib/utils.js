'use strict'

const dateformat = require('dateformat')
const defaultColorizer = require('./colors')()
const { DATE_FORMAT, MESSAGE_KEY, LEVELS } = require('./constants')

module.exports = {
  prettifyLevel,
  prettifyMessage,
  prettifyMetadata,
  prettifyTime
}

function formatTime (epoch, translateTime) {
  const instant = new Date(epoch)
  if (translateTime === true) {
    return dateformat(instant, 'UTC:' + DATE_FORMAT)
  } else {
    const upperFormat = translateTime.toUpperCase()
    return (!upperFormat.startsWith('SYS:'))
      ? dateformat(instant, 'UTC:' + translateTime)
      : (upperFormat === 'SYS:STANDARD')
        ? dateformat(instant, DATE_FORMAT)
        : dateformat(instant, translateTime.slice(4))
  }
}

function prettifyLevel ({ log, colorizer = defaultColorizer }) {
  if ('level' in log === false) return undefined
  return LEVELS.hasOwnProperty(log.level) ? colorizer[log.level](LEVELS[log.level]) : colorizer.default(LEVELS.default)
}

function prettifyMessage ({ log, messageKey = MESSAGE_KEY, colorizer = defaultColorizer }) {
  if (messageKey in log === false) return undefined
  if (typeof log[messageKey] !== 'string') return undefined
  return colorizer.message(log[messageKey])
}

function prettifyMetadata ({ log }) {
  if (log.name || log.pid || log.hostname) {
    let line = '('

    if (log.name) {
      line += log.name
    }

    if (log.name && log.pid) {
      line += '/' + log.pid
    } else if (log.pid) {
      line += log.pid
    }

    if (log.hostname) {
      // If `pid` and `name` were in the ignore keys list then we don't need
      // the leading space.
      line += `${line === '(' ? 'on' : ' on'} ${log.hostname}`
    }

    line += ')'
    return line
  }
  return undefined
}

function prettifyTime ({ log, translateFormat = undefined }) {
  if ('time' in log === false) return undefined
  if (translateFormat) {
    return '[' + formatTime(log.time, translateFormat) + ']'
  }
  return `[${log.time}]`
}
