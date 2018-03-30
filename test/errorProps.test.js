'use strict'

const Writable = require('stream').Writable
const test = require('tap').test
const pino = require('pino')
const prettyFactory = require('../')

// All dates are computed from 'Fri, 30 Mar 2018 17:35:28 GMT'
const epoch = 1522431328992

test('error like objects tests', (t) => {
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

  t.test('errorProps recognizes user specified properties', (t) => {
    t.plan(3)
    const pretty = prettyFactory({errorProps: 'statusCode,originalStack'})
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.match(formatted, /\s{4}error stack/)
        t.match(formatted, /statusCode: 500/)
        t.match(formatted, /originalStack: original stack/)
        cb()
      }
    }))

    const error = Error('error message')
    error.stack = 'error stack'
    error.statusCode = 500
    error.originalStack = 'original stack'

    log.error(error)
  })

  test('handles errors with a null stack', (t) => {
    t.plan(2)
    const pretty = prettyFactory()
    const log = pino({}, new Writable({
      write (chunk, enc, cb) {
        const formatted = pretty(chunk.toString())
        t.match(formatted, /\s{4}message: "foo"/)
        t.match(formatted, /\s{4}stack: null/)
        cb()
      }
    }))

    const error = {message: 'foo', stack: null}
    log.error(error)
  })

  t.end()
})
