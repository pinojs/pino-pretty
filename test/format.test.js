'use strict'

const { Writable } = require('readable-stream')
const os = require('os')
const test = require('tap').test
const pino = require('pino')
const _prettyFactory = require('../')

function prettyFactory (opts) {
  if (!opts) {
    opts = { colorize: false }
  } else if (!opts.hasOwnProperty('colorize')) {
    opts.colorize = false
  }
  return _prettyFactory(opts)
}

// All dates are computed from 'Fri, 30 Mar 2018 17:35:28 GMT'
const epoch = 1522431328992
const pid = process.pid
const hostname = os.hostname()
const options = {
  ignoreKeys: ['time', 'pid', 'hostname', 'v'],
  format: [
    { key: 'level' },
    { delimiter: ' [app:log-test]' },
    { delimiter: ' [', requireOneOfKeyss: ['class', 'method'] },
    { key: 'class' },
    { delimiter: ':', requireAllKeys: ['class', 'method'] },
    { key: 'method' },
    { delimiter: ']', requireOneOfKeyss: ['class', 'method'] },
    { delimiter: ': ' }
  ]
}

test('formatting tests', (t) => {
  t.beforeEach((done) => {
    Date.originalNow = Date.now
    Date.now = () => epoch

    done()
  })
  t.afterEach((done) => {
    Date.now = Date.originalNow
    delete Date.originalNow
    done()
  })

  t.test('Output class only', (t) => {
    t.plan(1)
    const pretty = prettyFactory(options)
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.is(
          formatted,
          `INFO  [app:log-test] [HTTPClient]: request sent\n`
        )
        cb()
      }
    }))
    log.info({ class: 'HTTPClient' }, 'request sent')
  })

  t.test('Output method only', (t) => {
    t.plan(1)
    const pretty = prettyFactory(options)
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.is(
          formatted,
          `INFO  [app:log-test] [send]: request sent\n`
        )
        cb()
      }
    }))
    log.info({ method: 'send' }, 'request sent')
  })

  t.test('Output class and method', (t) => {
    t.plan(1)
    const pretty = prettyFactory(options)
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.is(
          formatted,
          `INFO  [app:log-test] [HTTPClient:send]: request sent\n`
        )
        cb()
      }
    }))
    log.info({ class: 'HTTPClient', method: 'send' }, 'request sent')
  })

  t.test('Output class and method and additional object', (t) => {
    t.plan(1)
    const pretty = prettyFactory(options)
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.is(
          formatted,
          `INFO  [app:log-test] [HTTPClient:send]: request sent\n    a: "b"\n`
        )
        cb()
      }
    }))
    log.info({ class: 'HTTPClient', method: 'send', a: 'b' }, 'request sent')
  })

  t.test('Output class and method and deep object', (t) => {
    t.plan(1)
    const pretty = prettyFactory(options)
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.is(
          formatted,
          `INFO  [app:log-test] [HTTPClient:send]: request sent\n    a: {\n      "b": "c"\n    }\n`
        )
        cb()
      }
    }))
    log.info({ class: 'HTTPClient', method: 'send', a: { b: 'c' } }, 'request sent')
  })

  t.test('Output only the message', (t) => {
    t.plan(1)
    const pretty = prettyFactory({ format: [], ignoreKeys: ['level', 'time', 'name', 'pid', 'hostname', 'v'] })
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.is(
          formatted,
          `request sent\n`
        )
        cb()
      }
    }))
    log.info('request sent')
  })

  t.test('Output the message with all other keys as additional properties', (t) => {
    t.plan(1)
    const pretty = prettyFactory({ format: [] })
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.is(
          formatted,
          `request sent\n    level: 30\n    time: 1522431328992\n    pid: ${pid}\n    hostname: "${hostname}"\n`
        )
        cb()
      }
    }))
    log.info('request sent')
  })

  t.test('Output only level and message', (t) => {
    t.plan(1)
    const pretty = prettyFactory({
      format: [
        { key: 'level' },
        { delimiter: ' : ' }
      ],
      ignoreKeys: ['time', 'name', 'pid', 'hostname', 'v'] })
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.is(
          formatted,
          `INFO  : request sent\n`
        )
        cb()
      }
    }))
    log.info('request sent')
  })

  t.end()
})
