'use strict'

module.exports = {
  DATE_FORMAT: 'yyyy-mm-dd HH:MM:ss.l o',

  ERROR_LIKE_KEYS: ['err', 'error'],

  MESSAGE_KEY: 'msg',

  LEVELS: {
    default: 'USERLVL',
    60: 'FATAL',
    50: 'ERROR',
    40: 'WARN ',
    30: 'INFO ',
    20: 'DEBUG',
    10: 'TRACE'
  },

  // Object keys that probably came from a logger like Pino or Bunyan.
  LOGGER_KEYS: [
    'pid',
    'hostname',
    'name',
    'level',
    'time',
    'v'
  ]
}
