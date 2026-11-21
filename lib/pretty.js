'use strict'

module.exports = pretty

const sjs = require('secure-json-parse')

const { createCopier } = require('fast-copy')
const fastCopy = createCopier({})

const isObject = require('./utils/is-object')
const deleteLogProperty = require('./utils/delete-log-property')
const getPropertyValue = require('./utils/get-property-value')
const prettifyErrorLog = require('./utils/prettify-error-log')
const prettifyLevel = require('./utils/prettify-level')
const prettifyMessage = require('./utils/prettify-message')
const prettifyMetadata = require('./utils/prettify-metadata')
const prettifyObject = require('./utils/prettify-object')
const prettifyTime = require('./utils/prettify-time')
const filterLog = require('./utils/filter-log')
const splitPropertyKey = require('./utils/split-property-key')

const {
  LEVELS,
  LEVEL_KEY,
  LEVEL_NAMES
} = require('./constants')

const jsonParser = input => {
  try {
    return { value: sjs.parse(input, { protoAction: 'remove' }) }
  } catch (err) {
    return { err }
  }
}

/**
 * Orchestrates processing the received log data according to the provided
 * configuration and returns a prettified log string.
 *
 * @typedef {function} LogPrettifierFunc
 * @param {string|object} inputData A log string or a log-like object.
 * @returns {string} A string that represents the prettified log data.
 */
function pretty (inputData) {
  let log
  if (!isObject(inputData)) {
    const parsed = jsonParser(inputData)
    if (parsed.err || !isObject(parsed.value)) {
      // pass through
      return inputData + this.EOL
    }
    log = parsed.value
  } else {
    log = inputData
  }

  if (this.minimumLevel) {
    // We need to figure out if the custom levels has the desired minimum
    // level & use that one if found. If not, determine if the level exists
    // in the standard levels. In both cases, make sure we have the level
    // number instead of the level name.
    let condition
    if (this.useOnlyCustomProps) {
      condition = this.customLevels
    } else {
      condition = this.customLevelNames[this.minimumLevel] !== undefined
    }
    let minimum
    if (condition) {
      minimum = this.customLevelNames[this.minimumLevel]
    } else {
      minimum = LEVEL_NAMES[this.minimumLevel]
    }
    if (!minimum) {
      minimum = typeof this.minimumLevel === 'string'
        ? LEVEL_NAMES[this.minimumLevel]
        : LEVEL_NAMES[LEVELS[this.minimumLevel].toLowerCase()]
    }

    const level = log[this.levelKey === undefined ? LEVEL_KEY : this.levelKey]
    if (level < minimum) return
  }

  const prettifiedMessage = prettifyMessage({ log, context: this.context })

  if (this.ignoreKeys || this.includeKeys) {
    log = filterLog({ log, context: this.context })
  }

  const prettifiedLevel = prettifyLevel({
    log,
    context: {
      ...this.context,
      // This is odd. The colorizer ends up relying on the value of
      // `customProperties` instead of the original `customLevels` and
      // `customLevelNames`.
      ...this.context.customProperties
    }
  })
  const prettifiedMetadata = prettifyMetadata({ log, context: this.context })
  const prettifiedTime = prettifyTime({ log, context: this.context })

  let line = ''
  if (this.levelFirst && prettifiedLevel) {
    line = `${prettifiedLevel}`
  }

  if (prettifiedTime && line === '') {
    line = `${prettifiedTime}`
  } else if (prettifiedTime) {
    line = `${line} ${prettifiedTime}`
  }

  if (!this.levelFirst && prettifiedLevel) {
    if (line.length > 0) {
      line = `${line} ${prettifiedLevel}`
    } else {
      line = prettifiedLevel
    }
  }

  if (prettifiedMetadata) {
    if (line.length > 0) {
      line = `${line} ${prettifiedMetadata}:`
    } else {
      line = prettifiedMetadata
    }
  }

  if (line.endsWith(':') === false && line !== '') {
    line += ':'
  }

  if (prettifiedMessage !== undefined) {
    if (line.length > 0) {
      line = `${line} ${prettifiedMessage}`
    } else {
      line = prettifiedMessage
    }
  }

  if (line.length > 0 && !this.singleLine) {
    line += this.EOL
  }

  // pino@7+ does not log this anymore
  if (log.type === 'Error' && typeof log.stack === 'string') {
    const prettifiedErrorLog = prettifyErrorLog({ log, context: this.context })
    if (this.singleLine) line += this.EOL
    line += prettifiedErrorLog
  } else if (this.hideObject === false) {
    // Skip message/level/time keys that were already rendered in the header.
    // Nested keys (e.g. nested_key.time) must be removed via path delete so they
    // are not printed again in the object dump (levelKey already documented this).
    const candidateSkipKeys = [
      this.messageKey,
      this.levelKey,
      this.timestampKey
    ]
    let objectLog = log
    let mutated = false
    for (const key of candidateSkipKeys) {
      const value = getPropertyValue(log, key)
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        continue
      }
      if (!mutated) {
        objectLog = fastCopy(log)
        mutated = true
      }
      deleteLogProperty(objectLog, key)
      pruneEmptyParents(objectLog, key)
    }
    const prettifiedObject = prettifyObject({
      log: objectLog,
      skipKeys: [],
      context: this.context
    })

    // In single line mode, include a space only if prettified version isn't empty
    if (this.singleLine && !/^\s$/.test(prettifiedObject)) {
      line += ' '
    }
    line += prettifiedObject
  }

  return line
}

/**
 * After removing a nested property, drop parent objects that became empty so
 * the object dump does not print `nested_key: {}`.
 *
 * @param {object} log
 * @param {string} property
 */
function pruneEmptyParents (log, property) {
  const props = splitPropertyKey(property)
  while (props.length > 1) {
    props.pop()
    const parent = getPropertyValue(log, props)
    if (
      parent === null ||
      typeof parent !== 'object' ||
      Array.isArray(parent) ||
      Object.keys(parent).length > 0
    ) {
      break
    }
    const parentKey = props[props.length - 1]
    const grandProps = props.slice(0, -1)
    const grand = grandProps.length === 0 ? log : getPropertyValue(log, grandProps)
    if (grand !== null && typeof grand === 'object' && Object.prototype.hasOwnProperty.call(grand, parentKey)) {
      delete grand[parentKey]
    }
  }
}
