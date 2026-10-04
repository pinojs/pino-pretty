'use strict'

module.exports = filterLog

const { createCopier } = require('fast-copy')
const fastCopy = createCopier({})

const deleteLogProperty = require('./delete-log-property')
const getPropertyValue = require('./get-property-value')
const splitPropertyKey = require('./split-property-key')

/**
 * @typedef {object} FilterLogParams
 * @property {object} log The log object to be modified.
 * @property {PrettyContext} context The context object built from parsing
 * the options.
 */

/**
 * True when every segment of a (possibly nested) property path exists.
 *
 * @param {object} log
 * @param {string} property
 * @returns {boolean}
 */
function hasLogProperty (log, property) {
  const props = splitPropertyKey(property)
  if (props.length === 0) {
    return false
  }
  let current = log

  for (const prop of props) {
    if (current === null || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, prop)) {
      return false
    }
    current = current[prop]
  }

  return true
}

/**
 * Assigns `value` at a (possibly nested) property path, creating intermediate
 * objects as needed. Nested keys use the same `.` / `\.` rules as ignore.
 *
 * @param {object} log
 * @param {string} property
 * @param {*} value
 */
function setLogProperty (log, property, value) {
  const props = splitPropertyKey(property)
  const last = props.pop()
  let current = log

  for (const prop of props) {
    if (current[prop] === null || typeof current[prop] !== 'object') {
      current[prop] = {}
    }
    current = current[prop]
  }

  current[last] = value
}

/**
 * Filter a log object by removing or including keys accordingly.
 * When `includeKeys` is passed, `ignoredKeys` will be ignored.
 * One of ignoreKeys or includeKeys must be pass in.
 *
 * Nested keys (e.g. `user.id`) are supported for both include and ignore,
 * including escaped dots in property names.
 *
 * @param {FilterLogParams} input
 *
 * @returns {object} A new `log` object instance that
 *  either only includes the keys in includeKeys
 *  or does not include those in ignoredKeys.
 */
function filterLog ({ log, context }) {
  const { ignoreKeys, includeKeys } = context
  const logCopy = fastCopy(log)

  if (includeKeys) {
    const logIncluded = {}

    includeKeys.forEach((key) => {
      if (hasLogProperty(logCopy, key)) {
        setLogProperty(logIncluded, key, getPropertyValue(logCopy, key))
      }
    })
    return logIncluded
  }

  ignoreKeys.forEach((ignoreKey) => {
    deleteLogProperty(logCopy, ignoreKey)
  })
  return logCopy
}
