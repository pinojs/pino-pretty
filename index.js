'use strict'

const { isColorSupported } = require('colorette')
const pump = require('pump')
const { Transform } = require('readable-stream')
const abstractTransport = require('pino-abstract-transport')
const sjs = require('secure-json-parse')
const colors = require('./lib/colors')
const {
  ERROR_LIKE_KEYS,
  MESSAGE_KEY,
  TIMESTAMP_KEY,
  LEVELS,
  LEVEL_KEY,
  LEVEL_NAMES
} = require('./lib/constants')
const {
  isObject,
  prettifyErrorLog,
  prettifyLevel,
  prettifyMessage,
  prettifyMetadata,
  prettifyObject,
  prettifyTime,
  buildSafeSonicBoom,
  filterLog,
  parseFactoryOptions
} = require('./lib/utils')

const jsonParser = input => {
  try {
    return { value: sjs.parse(input, { protoAction: 'remove' }) }
  } catch (err) {
    return { err }
  }
}

/**
 * @typedef {object} PinoPrettyOptions
 * @property {boolean} [colorize] Indicates if colors should be used when
 * prettifying. The default will be determined by the terminal capabilities at
 * run time.
 * @property {boolean} [colorizeObjects=true] Apply coloring to rendered objects
 * when coloring is enabled.
 * @property {boolean} [crlf=false] End lines with `\r\n` instead of `\n`.
 * @property {K_ERROR_LIKE_KEYS} [errorLikeObjectKeys] A list of string property
 * names to consider as error objects.
 * @property {string} [errorProps=''] A comma separated list of properties on
 * error objects to include in the output.
 * @property {string|null} [customLevels=null] A comma separated list of user
 * defined level names and numbers, e.g. `err:99,info:1`.
 * @property {string|null} [customColors=null] A comma separated list of colors
 * to use for specific level labels, e.g. `err:red,info:blue`.
 * @property {boolean} [useOnlyCustomProps=true] When true, only custom levels
 * and colors will be used if they have been provided.
 * @property {boolean} [levelFirst=false] When true, the log level will be the
 * first field in the prettified output.
 * @property {string} [messageKey='msg'] Defines the key in incoming logs that
 * contains the message of the log, if present.
 * @property {null|MessageFormatString|MessageFormatFunction} [messageFormat=null]
 * When a string, defines how the prettified line should be formatted according
 * to defined tokens. When a function, a synchronous function that returns a
 * formatted string.
 * @property {undefined|string|number} [minimumLevel=undefined] The minimum
 * level for logs that should be processed. Any logs below this level will
 * be omitted.
 * @property {string} [timestampKey='time'] Defines the key in incoming logs
 * that contains the timestamp of the log, if present.
 * @property {boolean} [translateTime=true] When true, will translate a
 * JavaScript date integer into a human-readable string.
 * @property {object} [outputStream=process.stdout] The stream to write
 * prettified log lines to.
 * @property {CustomPrettifiers} [customPrettifiers={}] A set of prettifier
 * functions to apply to keys defined in this object.
 * @property {boolean} [hideObject=false] When `true`, data objects will be
 * omitted from the output (except for error objects).
 * @property {string} [ignore='hostname'] A comma separated list of log keys
 * to omit when outputting the prettified log information.
 * @property {undefined|string} [include=undefined] A comma separated list of
 * log keys to include in the prettified log information. Only the keys in this
 * list will be included in the output.
 * @property {boolean} [singleLine=false] When `true` any objects, except error
 * objects, in the log data will be printed as a single line instead as multiple
 * lines.
 */

/**
 * The default options that will be used when prettifying log lines.
 *
 * @type {PinoPrettyOptions}
 */
const defaultOptions = {
  colorize: isColorSupported,
  colorizeObjects: true,
  crlf: false,
  errorLikeObjectKeys: ERROR_LIKE_KEYS,
  errorProps: '',
  customLevels: null,
  customColors: null,
  useOnlyCustomProps: true,
  levelFirst: false,
  messageKey: MESSAGE_KEY,
  messageFormat: null,
  minimumLevel: undefined,
  timestampKey: TIMESTAMP_KEY,
  translateTime: true,
  outputStream: process.stdout,
  customPrettifiers: {},
  hideObject: false,
  ignore: 'hostname',
  include: undefined,
  singleLine: false
}

/**
 * Processes the supplied options and returns a function that accepts log data
 * and produces a prettified log string.
 *
 * @param {PinoPrettyOptions} options Configuration for the prettifier.
 * @returns {LogPrettifierFunc}
 */
function prettyFactory (options) {
  const context = parseFactoryOptions(Object.assign({}, defaultOptions, options))
  return pretty.bind({ ...context, context })

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

    const prettifiedMessage = prettifyMessage({
      log,
      messageKey: this.messageKey,
      colorizer: this.colorizer,
      messageFormat: this.messageFormat,
      levelLabel: this.levelLabel,
      ...this.customProperties,
      useOnlyCustomProps: this.useOnlyCustomProps
    })

    if (this.ignoreKeys || this.includeKeys) {
      log = filterLog({
        log,
        ignoreKeys: this.ignoreKeys,
        includeKeys: this.includeKeys
      })
    }

    const prettifiedLevel = prettifyLevel({
      log,
      colorizer: this.colorizer,
      levelKey: this.levelKey,
      prettifier: this.customPrettifiers.level,
      ...this.customProperties
    })
    const prettifiedMetadata = prettifyMetadata({
      log,
      prettifiers: this.customPrettifiers
    })
    const prettifiedTime = prettifyTime({
      log,
      translateFormat: this.translateTime,
      timestampKey: this.timestampKey,
      prettifier: this.customPrettifiers.time
    })

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
    if (log.type === 'Error' && log.stack) {
      const prettifiedErrorLog = prettifyErrorLog({
        log,
        errorLikeKeys: this.errorLikeObjectKeys,
        errorProperties: this.errorProps,
        ident: this.IDENT,
        eol: this.EOL
      })
      if (this.singleLine) line += this.EOL
      line += prettifiedErrorLog
    } else if (!this.hideObject) {
      const skipKeys = [
        this.messageKey,
        this.levelKey,
        this.timestampKey
      ].filter(key => {
        return typeof log[key] === 'string' ||
          typeof log[key] === 'number' ||
          typeof log[key] === 'boolean'
      })
      const prettifiedObject = prettifyObject({
        input: log,
        skipKeys,
        customPrettifiers: this.customPrettifiers,
        errorLikeKeys: this.errorLikeObjectKeys,
        eol: this.EOL,
        ident: this.IDENT,
        singleLine: this.singleLine,
        colorizer: this.objectColorizer
      })

      // In single line mode, include a space only if prettified version isn't empty
      if (this.singleLine && !/^\s$/.test(prettifiedObject)) {
        line += ' '
      }
      line += prettifiedObject
    }

    return line
  }
}

/**
 * @typedef {PinoPrettyOptions} BuildStreamOpts
 * @property {object|number|string} [destination] A destination stream, file
 * descriptor, or target path to a file.
 * @property {boolean} [append]
 * @property {boolean} [mkdir]
 * @property {boolean} [sync=false]
 */

/**
 * Constructs a {@link LogPrettifierFunc} and a stream to which the produced
 * prettified log data will be written.
 *
 * @param {BuildStreamOpts} opts
 * @returns {Transform | (Transform & OnUnknown)}
 */
function build (opts = {}) {
  const pretty = prettyFactory(opts)
  return abstractTransport(function (source) {
    const stream = new Transform({
      objectMode: true,
      autoDestroy: true,
      transform (chunk, enc, cb) {
        const line = pretty(chunk)
        cb(null, line)
      }
    })

    let destination

    if (typeof opts.destination === 'object' && typeof opts.destination.write === 'function') {
      destination = opts.destination
    } else {
      destination = buildSafeSonicBoom({
        dest: opts.destination || 1,
        append: opts.append,
        mkdir: opts.mkdir,
        sync: opts.sync // by default sonic will be async
      })
    }

    source.on('unknown', function (line) {
      destination.write(line + '\n')
    })

    pump(source, stream, destination)
    return stream
  }, { parse: 'lines' })
}

module.exports = build
module.exports.prettyFactory = prettyFactory
module.exports.colorizerFactory = colors
module.exports.default = build
