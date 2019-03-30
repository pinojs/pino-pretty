'use strict'

const path = require('path')
const spawn = require('child_process').spawn
const test = require('tap').test

const bin = require.resolve(path.join(__dirname, '..', 'bin.js'))
const epoch = 1522431328992
const logLine = '{"level":30,"time":1522431328992,"msg":"hello world","pid":42,"hostname":"foo","v":1}\n'

test('cli', (t) => {
  t.test('does basic reformatting', (t) => {
    t.plan(1)
    const child = spawn(process.argv0, [bin])
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), `[${epoch}] INFO  (42 on foo): hello world\n`)
    })
    child.stdin.write(logLine)
    t.tearDown(() => child.kill())
  })

  t.test('flips epoch and level', (t) => {
    t.plan(1)
    const child = spawn(process.argv0, [bin, '-l'])
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), `INFO  [${epoch}] (42 on foo): hello world\n`)
    })
    child.stdin.write(logLine)
    t.tearDown(() => child.kill())
  })

  t.test('translates time to default format', (t) => {
    t.plan(1)
    const child = spawn(process.argv0, [bin, '-t'])
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), `[2018-03-30 17:35:28.992 +0000] INFO  (42 on foo): hello world\n`)
    })
    child.stdin.write(logLine)
    t.tearDown(() => child.kill())
  })

  t.test('does search', (t) => {
    t.plan(1)
    const child = spawn(process.argv0, [bin, '-s', 'msg == `hello world`'])
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), `[${epoch}] INFO  (42 on foo): hello world\n`)
    })
    child.stdin.write(logLine)
    t.tearDown(() => child.kill())
  })

  t.test('does ignore multiple keys', (t) => {
    t.plan(1)
    const child = spawn(process.argv0, [bin, '-i', 'pid,hostname'])
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), `[1522431328992] INFO : hello world\n`)
    })
    child.stdin.write(logLine)
    t.tearDown(() => child.kill())
  })

  t.end()
})
