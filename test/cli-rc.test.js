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

  t.test('loads and applies default config file: pino-pretty.config.js', (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const configFile = path.join(tmpDir, 'pino-pretty.config.js')
    fs.writeFileSync(configFile, 'module.exports = { translateTime: true }')
    // Validate that the time has been translated
    const child = spawn(process.argv0, [bin], { cwd: tmpDir })
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), '[2018-03-30 17:35:28.992 +0000] INFO  (42 on foo): hello world\n')
    })
    child.stdin.write(logLine)
    t.tearDown(() => {
      fs.unlinkSync(configFile)
      child.kill()
    })
  })

  t.test('loads and applies default config file: .pino-prettyrc', (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const configFile = path.join(tmpDir, '.pino-prettyrc')
    fs.writeFileSync(configFile, JSON.stringify({ translateTime: true }, null, 4))
    // Validate that the time has been translated
    const child = spawn(process.argv0, [bin], { cwd: tmpDir })
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), '[2018-03-30 17:35:28.992 +0000] INFO  (42 on foo): hello world\n')
    })
    child.stdin.write(logLine)
    t.tearDown(() => {
      fs.unlinkSync(configFile)
      child.kill()
    })
  })

  t.test('loads and applies default config file: .pino-prettyrc.json', (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const configFile = path.join(tmpDir, '.pino-prettyrc.json')
    fs.writeFileSync(configFile, JSON.stringify({ translateTime: true }, null, 4))
    // Validate that the time has been translated
    const child = spawn(process.argv0, [bin], { cwd: tmpDir })
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), '[2018-03-30 17:35:28.992 +0000] INFO  (42 on foo): hello world\n')
    })
    child.stdin.write(logLine)
    t.tearDown(() => {
      fs.unlinkSync(configFile)
      child.kill()
    })
  })

  t.test('loads and applies custom config file: pino.config.test.json', (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const configFile = path.join(tmpDir, 'pino.config.test.json')
    fs.writeFileSync(configFile, JSON.stringify({ translateTime: true }, null, 4))
    // Validate that the time has been translated
    const child = spawn(process.argv0, [bin, '--config', configFile], { cwd: tmpDir })
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), '[2018-03-30 17:35:28.992 +0000] INFO  (42 on foo): hello world\n')
    })
    child.stdin.write(logLine)
    t.tearDown(() => child.kill())
  })

  t.test('loads and applies custom config file: pino.config.test.js', (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const configFile = path.join(tmpDir, 'pino.config.test.js')
    fs.writeFileSync(configFile, 'module.exports = { translateTime: true }')
    // Validate that the time has been translated
    const child = spawn(process.argv0, [bin, '--config', configFile], { cwd: tmpDir })
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), '[2018-03-30 17:35:28.992 +0000] INFO  (42 on foo): hello world\n')
    })
    child.stdin.write(logLine)
    t.tearDown(() => child.kill())
  })

  t.test('throws on missing config file', (t) => {
    t.plan(2)
    const child = spawn(process.argv0, [bin, '--config', 'pino.config.missing.json'], { cwd: tmpDir })
    child.on('close', (code) => t.is(code, 1))
    child.stderr.on('data', (data) => {
      t.contains(data.toString(), 'Error: Failed to load runtime configuration file: pino.config.missing.json\n')
    })
    t.tearDown(() => child.kill())
  })

  t.test('throws on invalid default config file', (t) => {
    t.plan(2)
    const configFile = path.join(tmpDir, 'pino-pretty.config.js')
    fs.writeFileSync(configFile, 'module.exports = () => {}')
    const child = spawn(process.argv0, [bin], { cwd: tmpDir })
    child.on('close', (code) => t.is(code, 1))
    child.stderr.on('data', (data) => {
      t.contains(data.toString(), 'Error: Invalid runtime configuration file: pino-pretty.config.js\n')
    })
    t.tearDown(() => child.kill())
  })

  t.test('throws on invalid custom config file', (t) => {
    t.plan(2)
    const configFile = path.join(tmpDir, 'pino.config.invalid.js')
    fs.writeFileSync(configFile, 'module.exports = () => {}')
    const child = spawn(process.argv0, [bin, '--config', 'pino.config.invalid.js'], { cwd: tmpDir })
    child.on('close', (code) => t.is(code, 1))
    child.stderr.on('data', (data) => {
      t.contains(data.toString(), 'Error: Invalid runtime configuration file: pino.config.invalid.js\n')
    })
    t.tearDown(() => child.kill())
  })

  t.end()
})
