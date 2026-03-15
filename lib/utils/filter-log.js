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
 * Filter a log object by removing or including keys accordingly.
 * When `includeKeys` is passed, `ignoredKeys` will be ignored.
 * One of ignoreKeys or includeKeys must be pass in.
 *
 * @param {FilterLogParams} input
 *
 * @returns {object} A new `log` object instance that
 *  either only includes the keys in ignoreKeys
 *  or does not include those in ignoredKeys.
 */
function filterLog ({ log, context }) {
  const { ignoreKeys, includeKeys } = context
  const logCopy = fastCopy(log)

  if (includeKeys) {
    const logIncluded = {}

    includeKeys.forEach((key) => {
      if (key === '') return
      const value = getPropertyValue(logCopy, key)
      if (value === undefined) return
      const props = splitPropertyKey(key)
      if (props.length === 1) {
        logIncluded[props[0]] = value
      } else {
        let current = logIncluded
        for (let i = 0; i < props.length - 1; i++) {
          if (current[props[i]] === undefined || typeof current[props[i]] !== 'object') {
            current[props[i]] = {}
          }
          current = current[props[i]]
        }
        current[props[props.length - 1]] = value
      }
    })
    return logIncluded
  }

  ignoreKeys.forEach((ignoreKey) => {
    deleteLogProperty(logCopy, ignoreKey)
  })
  return logCopy
}
