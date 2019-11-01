#!/usr/bin/env node

const fs = require('fs')
const args = require('args')
const path = require('path')
const pump = require('pump')
const split = require('split2')
const { Transform } = require('readable-stream')
const prettyFactory = require('./')
const CONSTANTS = require('./lib/constants')
const { isObject } = require('./lib/utils')

const bourne = require('@hapi/bourne')
const stripJsonComments = require('strip-json-comments')
const parseJSON = input => {
  return bourne.parse(stripJsonComments(input), { protoAction: 'remove' })
}

const JoyCon = require('joycon')
const joycon = new JoyCon({
  parseJSON,
  files: [
    'pino-pretty.config.js',
    '.pino-prettyrc',
    '.pino-prettyrc.json'
  ]
})
joycon.addLoader({
  test: /\.[^.]*rc$/,
  loadSync: (path) => parseJSON(fs.readFileSync(path, 'utf-8'))
})

args
  .option(['c', 'colorize'], 'Force adding color sequences to the output')
  .option(['f', 'crlf'], 'Append CRLF instead of LF to formatted lines')
  .option(['e', 'errorProps'], 'Comma separated list of properties on error objects to show (`*` for all properties)', '')
  .option(['l', 'levelFirst'], 'Display the log level as the first output field')
  .option(['k', 'errorLikeObjectKeys'], 'Define which keys contain error objects (`-k err,error`)', 'err,error')
  .option(['m', 'messageKey'], 'Highlight the message under the specified key', CONSTANTS.MESSAGE_KEY)
  .option(['a', 'timestampKey'], 'Display the timestamp from the specified key', CONSTANTS.TIMESTAMP_KEY)
  .option(['t', 'translateTime'], 'Display epoch timestamps as UTC ISO format or according to an optional format string (default ISO 8601)')
  .option(['s', 'search'], 'Specify a search pattern according to jmespath')
  .option(['i', 'ignore'], 'Ignore one or several keys: (`-i time,hostname`)')
  .option('config', 'specify a path to a json file containing the pino-pretty options')

args
  .example('cat log | pino-pretty', 'To prettify logs, simply pipe a log file through')
  .example('cat log | pino-pretty -m fooMessage', 'To highlight a string at a key other than \'msg\', use')
  .example('cat log | pino-pretty -a fooTimestamp', 'To display timestamp from a key other than \'time\', use')
  .example('cat log | pino-pretty -t', 'To convert Epoch timestamps to ISO timestamps use the -t option')
  .example('cat log | pino-pretty -t "SYS:yyyy-mm-dd HH:MM:ss"', 'To convert Epoch timestamps to local timezone format use the -t option with "SYS:" prefixed format string')
  .example('cat log | pino-pretty -l', 'To flip level and time/date in standard output use the -l option')
  .example('cat log | pino-pretty -s "msg == \'hello world\'"', 'Only prints messages with msg equals to \'hello world\'')
  .example('cat log | pino-pretty -i pid,hostname', 'Prettify logs but don\'t print pid and hostname')
  .example('cat log | pino-pretty --config=/path/to/config.json', 'Loads options from a config file')

const opts = args.parse(process.argv) || {}
Object.assign(opts, loadConfig(opts.config))
const pretty = prettyFactory(opts)
const prettyTransport = new Transform({
  objectMode: true,
  transform (chunk, enc, cb) {
    const line = pretty(chunk.toString())
    if (line === undefined) return cb()
    cb(null, line)
  }
})

pump(process.stdin, split(), prettyTransport, process.stdout)

// https://github.com/pinojs/pino/pull/358
if (!process.stdin.isTTY && !fs.fstatSync(process.stdin.fd).isFile()) {
  process.once('SIGINT', function noOp () {})
}

function loadConfig (configPath) {
  const options = {}
  if (configPath) {
    const filepath = path.resolve(configPath)
    const filename = path.basename(filepath)
    const parentDir = path.dirname(filepath)
    Object.assign(options, {
      files: [filename],
      cwd: parentDir,
      stopDir: path.dirname(parentDir)
    })
  }
  const result = joycon.loadSync(options)
  if (result.path && !isObject(result.data)) {
    configPath = configPath || path.basename(result.path)
    throw new Error(`Invalid runtime configuration file: ${configPath}`)
  }
  if (configPath && !result.data) {
    throw new Error(`Failed to load runtime configuration file: ${configPath}`)
  }
  return result.data
}
