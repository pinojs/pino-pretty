'use strict'

process.env.TZ = 'UTC'

const os = require('node:os')
const { describe, test, beforeEach, afterEach } = require('node:test')
const { Writable } = require('node:stream')
const pino = require('pino')

const pinoPretty = require('..')
const _prettyFactory = pinoPretty.prettyFactory

// Disable pino warnings
process.removeAllListeners('warning')

function prettyFactory (opts) {
  if (!opts) {
    opts = { colorize: false }
  } else if (!Object.prototype.hasOwnProperty.call(opts, 'colorize')) {
    opts.colorize = false
  }
  return _prettyFactory(opts)
}

// All dates are computed from 'Fri, 30 Mar 2018 17:35:28 GMT'
const epoch = 1522431328992
const formattedEpoch = '17:35:28.992'
const pid = process.pid
const hostname = os.hostname()

describe('boolean options string conversion', () => {
  beforeEach(() => {
    Date.originalNow = Date.now
    Date.now = () => epoch
  })
  afterEach(() => {
    Date.now = Date.originalNow
    delete Date.originalNow
  })

  test('accepts string "true" and "false" for all boolean options', async (t) => {
    const logLine = `{"level":30,"time":${epoch},"msg":"foo","pid":${pid},"hostname":"${hostname}"}`

    const testCases = [
      {
        option: 'colorize',
        testValue: (value) => {
          return new Promise((resolve) => {
            const pretty = prettyFactory({ colorize: value })
            const stream = new Writable({
              write (chunk, enc, cb) {
                const formatted = pretty(chunk.toString())
                if (value === 'true') {
                  t.assert.strictEqual(
                    formatted,
                    `[${formattedEpoch}] \u001B[32mINFO\u001B[39m (${pid}): \u001B[36mfoo\u001B[39m\n`
                  )
                } else {
                  t.assert.strictEqual(
                    formatted,
                    `[${formattedEpoch}] INFO (${pid}): foo\n`
                  )
                }
                cb()
                resolve()
              }
            })
            const log = pino({}, stream)
            log.info('foo')
          })
        }
      },
      {
        option: 'crlf',
        testValue: (value) => {
          return Promise.resolve().then(() => {
            const pretty = prettyFactory({ crlf: value })
            const formatted = pretty(logLine)
            if (value === 'true') {
              t.assert.strictEqual(formatted, `[${formattedEpoch}] INFO (${pid}): foo\r\n`)
            } else {
              t.assert.strictEqual(formatted, `[${formattedEpoch}] INFO (${pid}): foo\n`)
            }
          })
        }
      },
      {
        option: 'levelFirst',
        testValue: (value) => {
          return Promise.resolve().then(() => {
            const pretty = prettyFactory({ levelFirst: value })
            const formatted = pretty(logLine)
            if (value === 'true') {
              t.assert.strictEqual(formatted, `INFO [${formattedEpoch}] (${pid}): foo\n`)
            } else {
              t.assert.strictEqual(formatted, `[${formattedEpoch}] INFO (${pid}): foo\n`)
            }
          })
        }
      },
      {
        option: 'hideObject',
        testValue: (value) => {
          return new Promise((resolve) => {
            const pretty = prettyFactory({ hideObject: value })
            const stream = new Writable({
              write (chunk, enc, cb) {
                const formatted = pretty(chunk.toString())
                if (value === 'true') {
                  t.assert.strictEqual(formatted, `[${formattedEpoch}] INFO (${pid}): foo\n`)
                } else {
                  t.assert.match(formatted, /foo:\s*"bar"/)
                }
                cb()
                resolve()
              }
            })
            const log = pino({}, stream)
            log.info({ foo: 'bar' }, 'foo')
          })
        }
      },
      {
        option: 'singleLine',
        testValue: (value) => {
          return new Promise((resolve) => {
            const pretty = prettyFactory({ singleLine: value })
            const stream = new Writable({
              write (chunk, enc, cb) {
                const formatted = pretty(chunk.toString())
                if (value === 'true') {
                  t.assert.match(formatted, /{"foo":"bar"}/)
                  t.assert.doesNotMatch(formatted, /\n\s+foo:/)
                } else {
                  t.assert.match(formatted, /\n\s+foo:/)
                }
                cb()
                resolve()
              }
            })
            const log = pino({}, stream)
            log.info({ foo: 'bar' }, 'foo')
          })
        }
      },
      {
        option: 'colorizeObjects',
        testValue: (value) => {
          return new Promise((resolve) => {
            const pretty = prettyFactory({ colorize: true, singleLine: true, colorizeObjects: value })
            const stream = new Writable({
              write (chunk, enc, cb) {
                const formatted = pretty(chunk.toString())
                if (value === 'true') {
                  t.assert.strictEqual(
                    formatted,
                    `[${formattedEpoch}] \u001B[32mINFO\u001B[39m (${pid}): \u001B[36mfoo\u001B[39m \u001B[90m{"foo":"bar"}\u001B[39m\n`
                  )
                } else {
                  t.assert.strictEqual(
                    formatted,
                    `[${formattedEpoch}] \u001B[32mINFO\u001B[39m (${pid}): \u001B[36mfoo\u001B[39m {"foo":"bar"}\n`
                  )
                }
                cb()
                resolve()
              }
            })
            const log = pino({}, stream)
            log.info({ foo: 'bar' }, 'foo')
          })
        }
      },
      {
        option: 'translateTime',
        testValue: (value) => {
          return Promise.resolve().then(() => {
            const pretty = prettyFactory({ translateTime: value })
            const formatted = pretty(logLine)
            if (value === 'true') {
              t.assert.strictEqual(formatted, `[${formattedEpoch}] INFO (${pid}): foo\n`)
            } else {
              t.assert.match(formatted, new RegExp(`\\[${epoch}\\] INFO \\(${pid}\\): foo\\n`))
            }
          })
        }
      },
      {
        option: 'useOnlyCustomProps',
        testValue: (value) => {
          return new Promise((resolve) => {
            const pretty = prettyFactory({ useOnlyCustomProps: value, customLevels: 'custom:25' })
            const stream = new Writable({
              write (chunk, enc, cb) {
                const formatted = pretty(chunk.toString())
                if (value === 'true') {
                  t.assert.match(formatted, /USERLVL/)
                } else {
                  t.assert.match(formatted, /INFO/)
                }
                cb()
                resolve()
              }
            })
            const log = pino({ customLevels: { custom: 35 } }, stream)
            if (value === 'true') {
              log.custom('test')
            } else {
              log.info('test')
            }
          })
        }
      }
    ]

    for (const testCase of testCases) {
      await testCase.testValue('false')
      await testCase.testValue('true')
    }
  })

  test('translateTime still accepts format strings when not "true" or "false"', (t) => {
    t.plan(1)
    const pretty = prettyFactory({ translateTime: 'UTC:yyyy-mm-dd HH:MM:ss' })
    const formatted = pretty(`{"level":30,"time":${epoch},"msg":"foo","pid":${pid},"hostname":"${hostname}"}`)
    t.assert.match(formatted, /\[2018-03-30 17:35:28\] INFO/)
  })
})
