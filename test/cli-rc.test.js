'use strict'

const path = require('path')
const spawn = require('child_process').spawn
const test = require('tap').test
const fs = require('fs')
const rimraf = require('rimraf')

const bin = require.resolve(path.join(__dirname, '..', 'bin.js'))
const logLine = '{"level":30,"time":1522431328992,"msg":"hello world","pid":42,"hostname":"foo","v":1}\n'

test('cli', (t) => {
  let tmpDir
  t.beforeEach((done) => {
    tmpDir = path.join(__dirname, '.tmp' + Math.random())
    fs.mkdirSync(tmpDir)
    process.chdir(tmpDir)
    done()
  })

  t.afterEach((done) => {
    rimraf(tmpDir, () => {
      process.chdir(path.join(__dirname, '..'))
      done()
    })
  })

  t.test('loads and applies .pino-prettyrc.json', (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    let rcFile = path.join(process.cwd(), '.pino-prettyrc.json')
    require('fs').writeFileSync(rcFile, JSON.stringify({ translateTime: true }, null, 4))
    // Validate that the time has been translated
    const child = spawn(process.argv0, [bin])
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), `[2018-03-30 17:35:28.992 +0000] INFO  (42 on foo): hello world\n`)
    })
    child.stdin.write(logLine)
    t.tearDown(() => child.kill())
  })

  t.test('loads and applies .pino-prettyrc.test.json', (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    let testRcFile = path.join(process.cwd(), '.pino-prettyrc.test.json')
    require('fs').writeFileSync(testRcFile, JSON.stringify({ translateTime: true }, null, 4))
    // Validate that the time has been translated
    const child = spawn(process.argv0, [bin, '-o', testRcFile])
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), `[2018-03-30 17:35:28.992 +0000] INFO  (42 on foo): hello world\n`)
    })
    child.stdin.write(logLine)
    t.tearDown(() => child.kill())
  })

  t.end()
})
