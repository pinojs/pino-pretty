'use strict'

process.env.TZ = 'UTC'

const path = require('node:path')
const { spawn } = require('node:child_process')
const { describe, test } = require('node:test')
const { once } = require('./helper')

const bin = require.resolve(path.join(__dirname, '..', 'bin.js'))
const logLine = '{"level":30,"time":1522431328992,"msg":"hello world","pid":42,"hostname":"foo"}\n'
const baseEnv = { TERM: 'dumb', TZ: 'UTC' }
const formattedEpoch = '17:35:28.992'

describe('cli env vars', () => {
  test('PINO_PRETTY_LEVEL_FIRST=true flips level and time', async (t) => {
    t.plan(1)
    const env = { ...baseEnv, PINO_PRETTY_LEVEL_FIRST: 'true' }
    const child = spawn(process.argv[0], [bin], { env })
    child.on('error', t.assert.fail)
    const endPromise = once(child.stdout, 'data', (data) => {
      t.assert.strictEqual(data.toString(), `INFO [${formattedEpoch}] (42): hello world\n`)
    })
    child.stdin.write(logLine)
    await endPromise
    t.after(() => child.kill())
  })

  test('PINO_PRETTY_LEVEL_FIRST=1 flips level and time', async (t) => {
    t.plan(1)
    const env = { ...baseEnv, PINO_PRETTY_LEVEL_FIRST: '1' }
    const child = spawn(process.argv[0], [bin], { env })
    child.on('error', t.assert.fail)
    const endPromise = once(child.stdout, 'data', (data) => {
      t.assert.strictEqual(data.toString(), `INFO [${formattedEpoch}] (42): hello world\n`)
    })
    child.stdin.write(logLine)
    await endPromise
    t.after(() => child.kill())
  })

  test('PINO_PRETTY_SINGLE_LINE=true prints all on one line', async (t) => {
    t.plan(1)
    const multiKeyLog = '{"level":30,"time":1522431328992,"msg":"hello","pid":42,"hostname":"foo","extra":"value"}\n'
    const env = { ...baseEnv, PINO_PRETTY_SINGLE_LINE: 'true' }
    const child = spawn(process.argv[0], [bin], { env })
    child.on('error', t.assert.fail)
    const endPromise = once(child.stdout, 'data', (data) => {
      // In single line mode the extra fields appear inline, not on separate lines
      const output = data.toString()
      t.assert.ok(!output.includes('\n    '), 'should not have indented extra fields')
    })
    child.stdin.write(multiKeyLog)
    await endPromise
    t.after(() => child.kill())
  })

  test('PINO_PRETTY_IGNORE=pid,hostname removes those keys', async (t) => {
    t.plan(1)
    const env = { ...baseEnv, PINO_PRETTY_IGNORE: 'pid,hostname' }
    const child = spawn(process.argv[0], [bin], { env })
    child.on('error', t.assert.fail)
    const endPromise = once(child.stdout, 'data', (data) => {
      t.assert.strictEqual(data.toString(), `[${formattedEpoch}] INFO: hello world\n`)
    })
    child.stdin.write(logLine)
    await endPromise
    t.after(() => child.kill())
  })

  test('PINO_PRETTY_MESSAGE_KEY overrides default message key', async (t) => {
    t.plan(1)
    const customLog = '{"level":30,"time":1522431328992,"message":"custom key msg","pid":42,"hostname":"foo"}\n'
    const env = { ...baseEnv, PINO_PRETTY_MESSAGE_KEY: 'message' }
    const child = spawn(process.argv[0], [bin], { env })
    child.on('error', t.assert.fail)
    const endPromise = once(child.stdout, 'data', (data) => {
      t.assert.ok(data.toString().includes('custom key msg'))
    })
    child.stdin.write(customLog)
    await endPromise
    t.after(() => child.kill())
  })

  test('CLI flag overrides env var (CLI wins)', async (t) => {
    t.plan(1)
    // env says level-first=true, but CLI does not pass it => CLI default should win
    // Since the default is no levelFirst, output should show time first
    const env = { ...baseEnv, PINO_PRETTY_LEVEL_FIRST: 'false' }
    const child = spawn(process.argv[0], [bin, '--levelFirst'], { env })
    child.on('error', t.assert.fail)
    const endPromise = once(child.stdout, 'data', (data) => {
      // CLI flag wins: level appears first
      t.assert.strictEqual(data.toString(), `INFO [${formattedEpoch}] (42): hello world\n`)
    })
    child.stdin.write(logLine)
    await endPromise
    t.after(() => child.kill())
  })

  test('invalid PINO_PRETTY_LEVEL_FIRST value is silently ignored', async (t) => {
    t.plan(1)
    const env = { ...baseEnv, PINO_PRETTY_LEVEL_FIRST: 'yes' }
    const child = spawn(process.argv[0], [bin], { env })
    child.on('error', t.assert.fail)
    const endPromise = once(child.stdout, 'data', (data) => {
      // Default output: time first
      t.assert.strictEqual(data.toString(), `[${formattedEpoch}] INFO (42): hello world\n`)
    })
    child.stdin.write(logLine)
    await endPromise
    t.after(() => child.kill())
  })
})
