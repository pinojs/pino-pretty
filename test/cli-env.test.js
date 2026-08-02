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

describe('cli environment variables', () => {
  test('SINGLE_LINE=true enables single-line object output', async (t) => {
    t.plan(1)
    const logLineWithExtra = JSON.stringify(Object.assign(JSON.parse(logLine), {
      extra: {
        foo: 'bar',
        number: 42
      }
    })) + '\n'

    const child = spawn(process.argv[0], [bin], {
      env: { ...baseEnv, SINGLE_LINE: 'true' }
    })
    child.on('error', t.assert.fail)
    const endPromise = once(child.stdout, 'data', (data) => {
      t.assert.strictEqual(data.toString(), `[${formattedEpoch}] INFO (42): hello world {"extra":{"foo":"bar","number":42}}\n`)
    })
    child.stdin.end(logLineWithExtra)
    await endPromise
    t.after(() => child.kill())
  })

  test('LEVEL_FIRST=true flips epoch and level', async (t) => {
    t.plan(1)
    const child = spawn(process.argv[0], [bin], {
      env: { ...baseEnv, LEVEL_FIRST: 'true' }
    })
    child.on('error', t.assert.fail)
    const endPromise = once(child.stdout, 'data', (data) => {
      t.assert.strictEqual(data.toString(), `INFO [${formattedEpoch}] (42): hello world\n`)
    })
    child.stdin.end(logLine)
    await endPromise
    t.after(() => child.kill())
  })

  test('CLI -i overrides IGNORE environment variable', async (t) => {
    t.plan(1)
    const child = spawn(process.argv[0], [bin, '-i', 'time'], {
      env: { ...baseEnv, IGNORE: 'pid,hostname' }
    })
    child.on('error', t.assert.fail)
    const endPromise = once(child.stdout, 'data', (data) => {
      // CLI ignore=time wins over env ignore=pid,hostname, so pid/hostname remain.
      t.assert.strictEqual(data.toString(), 'INFO (42 on foo): hello world\n')
    })
    child.stdin.end(logLine)
    await endPromise
    t.after(() => child.kill())
  })

  test('COLORIZE=true is accepted as a boolean env value', async (t) => {
    t.plan(1)
    const child = spawn(process.argv[0], [bin], {
      env: { ...baseEnv, COLORIZE: 'true', TERM: 'xterm-256color' }
    })
    child.on('error', t.assert.fail)
    const endPromise = once(child.stdout, 'data', (data) => {
      const output = data.toString()
      t.assert.ok(output.includes('\u001b['), 'expected ANSI color sequences in output')
    })
    child.stdin.end(logLine)
    await endPromise
    t.after(() => child.kill())
  })
})
