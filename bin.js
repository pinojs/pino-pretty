#!/usr/bin/env node

const fs = require('fs')
const args = require('args')
const pump = require('pump')
const split = require('split2')
const through = require('through2')
const prettyFactory = require('./')

args
  .option(['c', 'color'], 'Force adding color sequences to the output')
  .option(['d', 'dateFormat'], 'A format string to govern display of dates', 'yyyy-MM-dd HH:mm:ss.SSS Z')
  .option(['e', 'errorProps'], 'Comma separated list of properties on error objects to show (`*` for all properties)', '')
  .option(['l', 'levelFirst'], 'Display the log level as the first output field')
  .option(['k', 'errorLikeObjectKeys'], 'Define which keys contain error objects (`-k err,error`)', 'err,error')
  .option(['m', 'messageKey'], 'Highlight the message under the specified key', 'msg')
  .option(['n', 'localTime'], 'Display timestamps according to system timezone')
  .option(['t', 'translateTime'], 'Convert Epoch timestamps to ISO format')

args
  .example('cat log | pino-pretty', 'To prettify logs, simply pipe a log file through')
  .example('cat log | pino-pretty -m fooMessage', 'To highlight a string at a key other than \'msg\', use')
  .example('cat log | pino-pretty -t', 'To convert Epoch timestamps to ISO timestamps use the -t option')
  .example('cat log | pino-pretty -l', 'To flip level and time/date in standard output use the -l option')

const opts = args.parse(process.argv)
const pretty = prettyFactory(opts)
const prettyTransport = through.obj(function (chunk, enc, cb) {
  process.stdout.write(pretty(chunk.toString()))
  cb()
})

pump(process.stdin, split(), prettyTransport)

if (!process.stdin.isTTY && !fs.fstatSync(process.stdin.fd).isFile()) {
  process.once('SIGINT', function noOp () {})
}
