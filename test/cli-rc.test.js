'use strict'

const path = require('path')
const spawn = require('child_process').spawn
const test = require('tap').test
const fs = require('fs')
const rimraf = require('rimraf')

const bin = require.resolve('../bin')
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
    const env = { TERM: 'dumb' }
    const child = spawn(process.argv0, [bin], { env, cwd: tmpDir })
    // Validate that the time has been translated
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
    const env = { TERM: 'dumb' }
    const child = spawn(process.argv0, [bin], { env, cwd: tmpDir })
    // Validate that the time has been translated
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
    const env = { TERM: 'dumb' }
    const child = spawn(process.argv0, [bin], { env, cwd: tmpDir })
    // Validate that the time has been translated
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

  t.test('loads and applies custom config file: pino-pretty.config.test.json', (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const configFile = path.join(tmpDir, 'pino-pretty.config.test.json')
    fs.writeFileSync(configFile, JSON.stringify({ translateTime: true }, null, 4))
    const env = { TERM: 'dumb' }
    const child = spawn(process.argv0, [bin, '--config', configFile], { env, cwd: tmpDir })
    // Validate that the time has been translated
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), '[2018-03-30 17:35:28.992 +0000] INFO  (42 on foo): hello world\n')
    })
    child.stdin.write(logLine)
    t.tearDown(() => child.kill())
  })

  t.test('loads and applies custom config file: pino-pretty.config.test.js', (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const configFile = path.join(tmpDir, 'pino-pretty.config.test.js')
    fs.writeFileSync(configFile, 'module.exports = { translateTime: true }')
    const env = { TERM: 'dumb' }
    const child = spawn(process.argv0, [bin, '--config', configFile], { env, cwd: tmpDir })
    // Validate that the time has been translated
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), '[2018-03-30 17:35:28.992 +0000] INFO  (42 on foo): hello world\n')
    })
    child.stdin.write(logLine)
    t.tearDown(() => child.kill())
  })

  t.test('cli options override config options', (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const configFile = path.join(tmpDir, 'pino-pretty.config.js')
    fs.writeFileSync(configFile, `
      module.exports = {
        translateTime: true,
        messageKey: 'custom_msg'
      }
    `.trim())
    // Set messageKey: 'new_msg' using command line option
    const env = { TERM: 'dumb' }
    const child = spawn(process.argv0, [bin, '--messageKey', 'new_msg'], { env, cwd: tmpDir })
    // Validate that the time has been translated and correct message key has been used
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.is(data.toString(), '[2018-03-30 17:35:28.992 +0000] INFO  (42 on foo): hello world\n')
    })
    child.stdin.write(logLine.replace(/"msg"/, '"new_msg"'))
    t.tearDown(() => {
      fs.unlinkSync(configFile)
      child.kill()
    })
  })

  t.test('throws on missing config file', (t) => {
    t.plan(2)
    const args = [bin, '--config', 'pino-pretty.config.missing.json']
    const env = { TERM: 'dumb' }
    const child = spawn(process.argv0, args, { env, cwd: tmpDir })
    child.on('close', (code) => t.is(code, 1))
    child.stderr.on('data', (data) => {
      t.contains(data.toString(), 'Error: Failed to load runtime configuration file: pino-pretty.config.missing.json\n')
    })
    t.tearDown(() => child.kill())
  })

  t.test('throws on invalid default config file', (t) => {
    t.plan(2)
    const configFile = path.join(tmpDir, 'pino-pretty.config.js')
    fs.writeFileSync(configFile, 'module.exports = () => {}')
    const env = { TERM: 'dumb' }
    const child = spawn(process.argv0, [bin], { env, cwd: tmpDir })
    child.on('close', (code) => t.is(code, 1))
    child.stderr.on('data', (data) => {
      t.contains(data.toString(), 'Error: Invalid runtime configuration file: pino-pretty.config.js\n')
    })
    t.tearDown(() => child.kill())
  })

  t.test('throws on invalid custom config file', (t) => {
    t.plan(2)
    const configFile = path.join(tmpDir, 'pino-pretty.config.invalid.js')
    fs.writeFileSync(configFile, 'module.exports = () => {}')
    const args = [bin, '--config', path.relative(tmpDir, configFile)]
    const env = { TERM: 'dumb' }
    const child = spawn(process.argv0, args, { env, cwd: tmpDir })
    child.on('close', (code) => t.is(code, 1))
    child.stderr.on('data', (data) => {
      t.contains(data.toString(), 'Error: Invalid runtime configuration file: pino-pretty.config.invalid.js\n')
    })
    t.tearDown(() => child.kill())
  })

  t.end()
})
