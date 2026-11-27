#!/usr/bin/env node

'use strict'

const fs = require('node:fs')
const path = require('node:path')
const help = require('help-me')({
  dir: path.join(__dirname, 'help'),
  ext: '.txt'
})
const pump = require('pump')
const sjp = require('secure-json-parse')
const JoyCon = require('joycon')
const { default: stripJsonComments } = require('strip-json-comments')

const build = require('./')
const CONSTANTS = require('./lib/constants')
const { isObject } = require('./lib/utils')
const minimist = require('minimist')

const parseJSON = input => {
  return sjp.parse(stripJsonComments(input), { protoAction: 'remove' })
}

const joycon = new JoyCon({
  parseJSON,
  files: [
    'pino-pretty.config.cjs',
    'pino-pretty.config.js',
    '.pino-prettyrc',
    '.pino-prettyrc.json'
  ],
  stopDir: path.dirname(process.cwd())
})

// Map SCREAMING_SNAKE env vars to camelCase CLI option names.
// Example: SINGLE_LINE=true COLORIZE=true pino-pretty
const ENV_OPTION_MAP = {
  COLORIZE: 'colorize',
  COLORIZE_OBJECTS: 'colorizeObjects',
  CONFIG: 'config',
  CRLF: 'crlf',
  CUSTOM_COLORS: 'customColors',
  CUSTOM_LEVELS: 'customLevels',
  ERROR_LIKE_OBJECT_KEYS: 'errorLikeObjectKeys',
  ERROR_PROPS: 'errorProps',
  HIDE_OBJECT: 'hideObject',
  IGNORE: 'ignore',
  INCLUDE: 'include',
  LEVEL_FIRST: 'levelFirst',
  LEVEL_KEY: 'levelKey',
  LEVEL_LABEL: 'levelLabel',
  MESSAGE_FORMAT: 'messageFormat',
  MESSAGE_KEY: 'messageKey',
  MINIMUM_LEVEL: 'minimumLevel',
  SINGLE_LINE: 'singleLine',
  TIMESTAMP_KEY: 'timestampKey',
  TRANSLATE_TIME: 'translateTime',
  USE_ONLY_CUSTOM_PROPS: 'useOnlyCustomProps'
}

const cmd = minimist(process.argv.slice(2))

if (cmd.h || cmd.help) {
  help.toStdout()
} else {
  const DEFAULT_VALUE = '\0default'

  let opts = minimist(process.argv, {
    alias: {
      colorize: 'c',
      crlf: 'f',
      errorProps: 'e',
      levelFirst: 'l',
      minimumLevel: 'L',
      customLevels: 'x',
      customColors: 'X',
      useOnlyCustomProps: 'U',
      errorLikeObjectKeys: 'k',
      messageKey: 'm',
      levelKey: CONSTANTS.LEVEL_KEY,
      levelLabel: 'b',
      messageFormat: 'o',
      timestampKey: 'a',
      translateTime: 't',
      ignore: 'i',
      include: 'I',
      hideObject: 'H',
      singleLine: 'S'
    },
    default: {
      messageKey: DEFAULT_VALUE,
      minimumLevel: DEFAULT_VALUE,
      levelKey: DEFAULT_VALUE,
      timestampKey: DEFAULT_VALUE
    }
  })

  // Remove default values
  opts = filter(opts, value => value !== DEFAULT_VALUE)
  const envOpts = loadEnvOptions()
  const config = loadConfig(opts.config || envOpts.config)
  // Precedence: CLI > config file > environment variables
  opts = Object.assign({}, envOpts, config, opts)
  // set defaults
  opts.errorLikeObjectKeys = opts.errorLikeObjectKeys || 'err,error'
  opts.errorProps = opts.errorProps || ''

  const res = build(opts)
  pump(process.stdin, res)

  // https://github.com/pinojs/pino/pull/358
  /* istanbul ignore next */
  if (!process.stdin.isTTY && !fs.fstatSync(process.stdin.fd).isFile()) {
    process.once('SIGINT', function noOp () {})
  }

  function loadEnvOptions () {
    const result = {}
    for (const [envName, optionName] of Object.entries(ENV_OPTION_MAP)) {
      if (Object.prototype.hasOwnProperty.call(process.env, envName)) {
        result[optionName] = process.env[envName]
      }
    }
    return result
  }

  function loadConfig (configPath) {
    const files = configPath ? [path.resolve(configPath)] : undefined
    const result = joycon.loadSync(files)
    if (result.path && !isObject(result.data)) {
      configPath = configPath || path.basename(result.path)
      throw new Error(`Invalid runtime configuration file: ${configPath}`)
    }
    if (configPath && !result.data) {
      throw new Error(`Failed to load runtime configuration file: ${configPath}`)
    }
    return result.data
  }

  function filter (obj, cb) {
    return Object.keys(obj).reduce((acc, key) => {
      const value = obj[key]
      if (cb(value, key)) {
        acc[key] = value
      }
      return acc
    }, {})
  }
}
