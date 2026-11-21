'use strict'

module.exports = getLogPropertyValue

const getPropertyValue = require('./get-property-value')
const splitPropertyKey = require('./split-property-key')

/**
 * Read configured log keys while preserving the legacy behavior for top-level
 * inherited properties. Nested paths remain restricted to own properties.
 *
 * @param {object} log
 * @param {string} property
 * @returns {*}
 */
function getLogPropertyValue (log, property) {
  const props = splitPropertyKey(property)

  if (props.length === 1 && props[0] in log) {
    return log[props[0]]
  }

  return getPropertyValue(log, props)
}
