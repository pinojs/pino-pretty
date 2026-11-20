'use strict'

module.exports = formatTime

const {
  DATE_FORMAT,
  DATE_FORMAT_SIMPLE
} = require('../constants')

const dateformat = require('dateformat')
const createDate = require('./create-date')
const isValidDate = require('./is-valid-date')

/**
 * Converts a given `epoch` to a desired display format.
 *
 * @param {number|string} epoch The time to convert. May be any value that is
 * valid for `new Date()`.
 * @param {boolean|string} [translateTime=false] When `false`, the given `epoch`
 * will simply be returned. When `true`, the given `epoch` will be converted
 * to a string at the local timezone using the `DATE_FORMAT_SIMPLE` constant.
 * If `translateTime` is a string, the following rules are available:
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
 * @param {string} [timeZone] An IANA time zone name, e.g.
 * `America/Los_Angeles`. When set, it is used instead of the system's local
 * timezone (for `true` and the `SYS:` formats). UTC formats are not affected.
 *
 * @returns {number|string} The formatted time.
 */
function formatTime (epoch, translateTime = false, timeZone) {
  if (translateTime === false) {
    return epoch
  }

  const instant = createDate(epoch)

  // If the Date is invalid, do not attempt to format
  if (!isValidDate(instant)) {
    return epoch
  }

  if (translateTime === true) {
    return formatLocal(instant, DATE_FORMAT_SIMPLE, timeZone)
  }

  const upperFormat = translateTime.toUpperCase()
  if (upperFormat === 'SYS:STANDARD') {
    return formatLocal(instant, DATE_FORMAT, timeZone)
  }

  const prefix = upperFormat.substr(0, 4)
  if (prefix === 'SYS:' || prefix === 'UTC:') {
    if (prefix === 'UTC:') {
      return dateformat(instant, translateTime)
    }
    return formatLocal(instant, translateTime.slice(4), timeZone)
  }

  return dateformat(instant, `UTC:${translateTime}`)
}

/**
 * Formats `instant` in the given time zone, or in the system's local time
 * zone when `timeZone` is not set.
 *
 * @param {Date} instant
 * @param {string} format A `dateformat` mask or named mask.
 * @param {string} [timeZone] An IANA time zone name.
 *
 * @returns {string}
 */
function formatLocal (instant, format, timeZone) {
  return timeZone
    ? formatInTimeZone(instant, format, timeZone)
    : dateformat(instant, format)
}

// The tokens `dateformat` understands, copied from its source (v4.6.3) so that
// the timezone tokens (`o`, `p`, `Z`) can be found and replaced.
const DATEFORMAT_TOKEN = /d{1,4}|D{3,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|W{1,2}|[LlopSZN]|"[^"]*"|'[^']*'/g

const timeZoneFormatters = new Map()

/**
 * Returns a cached `Intl.DateTimeFormat` that reports the wall-clock parts of
 * a date in the given time zone. Throws a `RangeError` for an unknown zone.
 *
 * @param {string} timeZone An IANA time zone name.
 *
 * @returns {Intl.DateTimeFormat}
 */
function getTimeZoneFormatter (timeZone) {
  let formatter = timeZoneFormatters.get(timeZone)
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      era: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short'
    })
    timeZoneFormatters.set(timeZone, formatter)
  }
  return formatter
}

/**
 * Formats `instant` with a `dateformat` mask as wall-clock time in the given
 * time zone, including the zone's offset for the `o`, `p` and `Z` tokens.
 *
 * @param {Date} instant
 * @param {string} format A `dateformat` mask or named mask.
 * @param {string} timeZone An IANA time zone name.
 *
 * @returns {string}
 */
function formatInTimeZone (instant, format, timeZone) {
  const mask = dateformat.masks[format] || format || dateformat.masks.default
  const maskPrefix = mask.slice(0, 4)
  if (maskPrefix === 'UTC:' || maskPrefix === 'GMT:') {
    return dateformat(instant, mask)
  }

  const parts = {}
  for (const { type, value } of getTimeZoneFormatter(timeZone).formatToParts(instant)) {
    parts[type] = value
  }

  // The wall-clock time in `timeZone`, stored as if it were UTC. Years before
  // year 1 come back as era years ("1 BC" is year 0).
  const year = parts.era === 'BC' ? 1 - Number(parts.year) : Number(parts.year)
  const wallClock = new Date(instant.getTime())
  wallClock.setUTCFullYear(year, Number(parts.month) - 1, Number(parts.day))
  wallClock.setUTCHours(Number(parts.hour), Number(parts.minute), Number(parts.second))

  // Near the limits of the Date range the shifted time may not exist.
  if (!isValidDate(wallClock)) {
    return dateformat(instant, mask)
  }

  const offset = Math.round((wallClock.getTime() - instant.getTime()) / 60000)
  const sign = offset < 0 ? '-' : '+'
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0')
  const zoneTokens = {
    o: `${sign}${hours}${minutes}`,
    p: `${sign}${hours}:${minutes}`,
    Z: parts.timeZoneName
  }

  const zonedMask = mask.replace(DATEFORMAT_TOKEN, (match) => {
    return match in zoneTokens ? `"${zoneTokens[match]}"` : match
  })

  return dateformat(wallClock, `UTC:${zonedMask}`)
}
