'use strict'

const Writable = require('stream').Writable
const os = require('os')
const test = require('tap').test
const pino = require('pino')
const joda = require('js-joda')
const prettyFactory = require('../')

// All dates are computed from 'Fri, 30 Mar 2018 17:35:28 GMT'
const epoch = 1522431328992
const pid = process.pid
const hostname = os.hostname()

joda.use(require('js-joda-timezone'))
joda.use(require('js-joda-locale'))

test('basic prettifier tests', (t) => {
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

  t.test('formats a line without any extra options', (t) => {
    t.plan(1)
    const pretty = prettyFactory()
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.is(
          formatted,
          `[${epoch}] INFO (${pid} on ${hostname}): foo\n`
        )
        cb()
      }
    }))
    log.info('foo')
  })

  t.test('will add color codes', (t) => {
    t.plan(1)
    const pretty = prettyFactory({colorize: true})
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.is(
          formatted,
          `[${epoch}] \u001B[32mINFO\u001B[39m (${pid} on ${hostname}): foo\n`
        )
        cb()
      }
    }))
    log.info('foo')
  })

  t.test('can swap date and level position', (t) => {
    t.plan(1)
    const pretty = prettyFactory({levelFirst: true})
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.is(
          formatted,
          `INFO [${epoch}] (${pid} on ${hostname}): foo\n`
        )
        cb()
      }
    }))
    log.info('foo')
  })

  t.test('can use different message keys', (t) => {
    t.plan(1)
    const pretty = prettyFactory({messageKey: 'bar'})
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.is(
          formatted,
          `[${epoch}] INFO (${pid} on ${hostname}): baz\n`
        )
        cb()
      }
    }))
    log.info({bar: 'baz'})
  })

  t.test('will format date to UTC', (t) => {
    t.plan(1)
    const pretty = prettyFactory({translateTime: true})
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.is(
          formatted,
          `[2018-03-30 17:35:28.992 +0000] INFO (${pid} on ${hostname}): foo\n`
        )
        cb()
      }
    }))
    log.info('foo')
  })

  t.test('will format date to local time', (t) => {
    t.plan(1)
    const pretty = prettyFactory({
      translateTime: true,
      localTime: true
    })
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        const zonedDateTime = joda.ZonedDateTime.ofInstant(
          joda.Instant.now(),
          joda.ZoneOffset.SYSTEM
        )
        const offset = joda.DateTimeFormatter.ofPattern('Z').format(
          zonedDateTime
        )
        const hour = Math.floor(
          ((17 * 3600) + joda.ZoneOffset.of(offset).totalSeconds()) / 3600
        )
        t.is(
          formatted,
          `[2018-03-30 ${hour}:35:28.992 ${offset}] INFO (${pid} on ${hostname}): foo\n`
        )
        cb()
      }
    }))
    log.info('foo')
  })

  t.test('will format date with a custom format string', (t) => {
    t.plan(1)
    const pretty = prettyFactory({
      translateTime: true,
      dateFormat: 'yyy-MM-dd HH:mm'
    })
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.is(
          formatted,
          `[2018-03-30 17:35] INFO (${pid} on ${hostname}): foo\n`
        )
        cb()
      }
    }))
    log.info('foo')
  })

  t.end()
})
