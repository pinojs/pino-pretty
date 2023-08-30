'use strict'

module.exports = parseFactoryOptions

const {
  LEVEL_NAMES
} = require('../constants')
const colors = require('../colors')
const handleCustomLevelsOpts = require('./handle-custom-levels-opts')
const handleCustomLevelsNamesOpts = require('./handle-custom-levels-names-opts')

/**
 * A `PrettyContext` is an object to be used by the various functions that
 * process log data. It is derived from the provided {@link PinoPrettyOptions}.
 * It may be used as a `this` context.
 *
 * @typedef {object} PrettyContext
 */

/**
 * @param {PinoPrettyOptions} options The user supplied object of options.
 *
 * @returns {PrettyContext}
 */
function parseFactoryOptions (options) {
  const EOL = options.crlf ? '\r\n' : '\n'
  const IDENT = '    '
  const {
    customPrettifiers,
    errorLikeObjectKeys,
    hideObject,
    levelFirst,
    levelKey,
    levelLabel,
    messageFormat,
    messageKey,
    minimumLevel,
    singleLine,
    timestampKey,
    translateTime
  } = options
  const errorProps = options.errorProps.split(',')
  const useOnlyCustomProps = typeof options.useOnlyCustomProps === 'boolean'
    ? options.useOnlyCustomProps
    : (options.useOnlyCustomProps === 'true')
  const customLevels = handleCustomLevelsOpts(options.customLevels)
  const customLevelNames = handleCustomLevelsNamesOpts(options.customLevels)

  let customColors
  if (options.customColors) {
    customColors = options.customColors.split(',').reduce((agg, value) => {
      const [level, color] = value.split(':')

      const condition = useOnlyCustomProps
        ? options.customLevels
        : customLevelNames[level] !== undefined
      const levelNum = condition
        ? customLevelNames[level]
        : LEVEL_NAMES[level]
      const colorIdx = levelNum !== undefined
        ? levelNum
        : level

      agg.push([colorIdx, color])

      return agg
    }, [])
  }

  const customProperties = { customLevels, customLevelNames }
  if (useOnlyCustomProps === true && !options.customLevels) {
    customProperties.customLevels = undefined
    customProperties.customLevelNames = undefined
  }

  const includeKeys = options.include !== undefined
    ? new Set(options.include.split(','))
    : undefined
  const ignoreKeys = (!includeKeys && options.ignore)
    ? new Set(options.ignore.split(','))
    : undefined

  const colorizer = colors(options.colorize, customColors, useOnlyCustomProps)
  const objectColorizer = options.colorizeObjects
    ? colorizer
    : colors(false, [], false)

  return {
    EOL,
    IDENT,
    colorizer,
    customColors,
    customLevelNames,
    customLevels,
    customPrettifiers,
    customProperties,
    errorLikeObjectKeys,
    errorProps,
    hideObject,
    ignoreKeys,
    includeKeys,
    levelFirst,
    levelKey,
    levelLabel,
    messageFormat,
    messageKey,
    minimumLevel,
    objectColorizer,
    singleLine,
    timestampKey,
    translateTime,
    useOnlyCustomProps
  }
}
