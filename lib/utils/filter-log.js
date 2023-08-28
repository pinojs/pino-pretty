'use strict'

module.exports = filterLog

const { createCopier } = require('fast-copy')
const fastCopy = createCopier({})

const deleteLogProperty = require('./delete-log-property')

/**
 * Filter a log object by removing or including keys accordingly.
 * When `includeKeys` is passed, `ignoredKeys` will be ignored.
 * One of ignoreKeys or includeKeys must be pass in.
 *
 * @param {object} input
 * @param {object} input.log The log object to be modified.
 * @param {Set<string> | Array<string> | undefined} input.ignoreKeys
 *  An array of strings identifying the properties to be removed.
 * @param {Set<string> | Array<string> | undefined} input.includeKeys
 *  An array of strings identifying the properties to be included.
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
