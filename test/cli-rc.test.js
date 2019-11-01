'use strict'

const path = require('path')
const spawn = require('child_process').spawn
const test = require('tap').test
const fs = require('fs')
const rimraf = require('rimraf')

const bin = require.resolve(path.join(__dirname, '..', 'bin.js'))
const logLine = '{"level":30,"time":1522431328992,"msg":"hello world","pid":42,"hostname":"foo","v":1}\n'
const noop = () => {}

test('cli', (t) => {
  const tmpDir = path.join(__dirname, '.tmp_' + Date.now())
  fs.mkdirSync(tmpDir)

  t.tearDown(() => rimraf(tmpDir, noop))

  t.test('loads and applies .pino-prettyrc.json', (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const rcFile = path.join(tmpDir, '.pino-prettyrc.json')
    fs.writeFileSync(rcFile, JSON.stringify({ translateTime: true }, null, 4))
    // Validate that the time has been translated
    const child = spawn(process.argv0, [bin], { cwd: tmpDir })
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), '[2018-03-30 17:35:28.992 +0000] INFO  (42 on foo): hello world\n')
    })
    child.stdin.write(logLine)
    t.tearDown(() => child.kill())
  })

  t.test('loads and applies .pino-prettyrc.test.json', (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const testRcFile = path.join(tmpDir, '.pino-prettyrc.test.json')
    fs.writeFileSync(testRcFile, JSON.stringify({ translateTime: true }, null, 4))
    // Validate that the time has been translated
    const child = spawn(process.argv0, [bin, '--config', testRcFile], { cwd: tmpDir })
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), '[2018-03-30 17:35:28.992 +0000] INFO  (42 on foo): hello world\n')
    })
    child.stdin.write(logLine)
    t.tearDown(() => child.kill())
  })

  t.end()
})
