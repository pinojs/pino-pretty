'use strict'

module.exports = formatTime

const {
  DATE_FORMAT,
  DATE_FORMAT_SIMPLE
} = require('../constants')

const { dateFormat: dateformat, DateFormatter } = require('@pinojs/dateformat')
const createDate = require('./create-date')
const isValidDate = require('./is-valid-date')

const dateFormatterSimple = new DateFormatter(DATE_FORMAT_SIMPLE)
const dateFormatter = new DateFormatter(DATE_FORMAT)

/**
 * Checks if the given format string is a UTC format.
 *
 * @param {string} mask The format string to check.
 * @returns {mask is `UTC:${string}`} `true` if the format string is a UTC format, otherwise `false`.
 */
function isUTC (mask) {
  return (
    (mask.charCodeAt(0) | 0x20 === 0x75) && // 'u'
    (mask.charCodeAt(1) | 0x20 === 0x74) && // 't'
    (mask.charCodeAt(2) | 0x20 === 0x63) // 'c'
  )
}

/**
 * Checks if the given format string is a SYS format.
 *
 * @param {string} mask The format string to check.
 * @returns {mask is `SYS:${string}`} `true` if the format string is a SYS format, otherwise `false`.
 */
function isSYS (mask) {
  return (
    (mask.charCodeAt(0) | 0x20 === 0x73) && // 's'
    (mask.charCodeAt(1) | 0x20 === 0x79) && // 'y'
    (mask.charCodeAt(2) | 0x20 === 0x73) // 's'
  )
}

/**
 * Checks if the given format string is SYS:STANDARD.
 * 
 * @param {string} mask The format string to check.
 * @returns {mask is 'SYS:STANDARD'} `true` if the format string is SYS:STANDARD, otherwise `false`.
 */
function isSysStandard (mask) {
  return (
    mask.length === 12 &&
    (mask.charCodeAt(4) | 0x20 === 0x73) && // 's'
    (mask.charCodeAt(5) | 0x20 === 0x74) && // 't'
    (mask.charCodeAt(6) | 0x20 === 0x61) && // 'a'
    (mask.charCodeAt(7) | 0x20 === 0x6e) && // 'n'
    (mask.charCodeAt(8) | 0x20 === 0x64) && // 'd'
    (mask.charCodeAt(9) | 0x20 === 0x61) && // 'a'
    (mask.charCodeAt(10) | 0x20 === 0x72) && // 'r'
    (mask.charCodeAt(11) | 0x20 === 0x64) // 'd
  )
}

/**
 * Converts a given `epoch` to a desired display format.
 *
 * @param {number|string} epoch The time to convert. May be any value that is
 * valid for `new Date()`.
 * @param {boolean|string} [translateTime=false] When `false`, the given `epoch`
 * will simply be returned. When `true`, the given `epoch` will be converted
 * to a string at UTC using the `DATE_FORMAT` constant. If `translateTime` is
 * a string, the following rules are available:
 *
 * - `<format string>`: The string is a literal format string. This format
 * string will be used to interpret the `epoch` and return a display string
 * at UTC.
 * - `SYS:STANDARD`: The returned display string will follow the `DATE_FORMAT`
 * constant at the system's local timezone.
 * - `SYS:<format string>`: The returned display string will follow the given
 * `<format string>` at the system's local timezone.
 * - `UTC:<format string>`: The returned display string will follow the given
 * `<format string>` at UTC.
 *
 * @returns {number|string} The formatted time.
 */
function formatTime (epoch, translateTime = false) {
  if (translateTime === false) {
    return epoch
  }

  const instant = createDate(epoch)

  // If the Date is invalid, do not attempt to format
  if (!isValidDate(instant)) {
    return epoch
  }

  if (translateTime === true) {
    return dateFormatterSimple.format(instant)
  }

  if (translateTime[3] !== ':') {
    return dateformat(instant, translateTime)
  }

  if (isSYS(translateTime)) {
    if (isSysStandard(translateTime)) {
      return dateFormatter.format(instant)
    }
    return dateformat(instant, translateTime.slice(4))
  }

  if (isUTC(translateTime)) {
    return dateformat(instant, translateTime, true)
  }

  return dateformat(instant, translateTime)
}
