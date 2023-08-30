'use strict'

module.exports = filterLog

const { createCopier } = require('fast-copy')
const fastCopy = createCopier({})

const deleteLogProperty = require('./delete-log-property')

/**
 * @typedef {object} FilterLogParams
 * @property {object} log The log object to be modified.
 * @property {Set<string> | Array<string> | undefined} ignoreKeys
 *  An array of strings identifying the properties to be removed.
 * @property {Set<string> | Array<string> | undefined} includeKeys
 *  An array of strings identifying the properties to be included.
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
function filterLog ({ log, ignoreKeys, includeKeys }) {
  const logCopy = fastCopy(log)

  if (includeKeys) {
    const logIncluded = {}

    includeKeys.forEach((key) => {
      logIncluded[key] = logCopy[key]
    })
    return logIncluded
  }

  ignoreKeys.forEach((ignoreKey) => {
    deleteLogProperty(logCopy, ignoreKey)
  })
  return logCopy
}
