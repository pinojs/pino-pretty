'use strict'

process.env.TZ = 'UTC'

const path = require('node:path')
const { spawn } = require('node:child_process')
const { test } = require('node:test')
const match = require('@jsumners/assert-match')
const fs = require('node:fs')
const { rimraf } = require('rimraf')

const bin = require.resolve('../bin')
const logLine = '{"level":30,"time":1522431328992,"msg":"hello world","pid":42,"hostname":"foo"}\n'

test('cli', async (t) => {
  const tmpDir = path.join(__dirname, '.tmp_' + Date.now())
  fs.mkdirSync(tmpDir)

  t.after(() => rimraf(tmpDir))

  await t.test('loads and applies default config file: pino-pretty.config.js', async (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const configFile = path.join(tmpDir, 'pino-pretty.config.js')
    fs.writeFileSync(configFile, 'module.exports = { translateTime: true }')
    const env = { TERM: 'dumb', TZ: 'UTC' }
    const child = spawn(process.argv[0], [bin], { env, cwd: tmpDir })
    // Validate that the time has been translated
    child.on('error', t.assert.fail)
    const endPromise = new Promise(resolve => {
      child.stdout.on('data', (data) => {
        t.assert.strictEqual(data.toString(), '[17:35:28.992] INFO (42): hello world\n')
        resolve()
      })
    })
    child.stdin.write(logLine)
    await endPromise
    t.after(() => {
      fs.unlinkSync(configFile)
      child.kill()
    })
  })

  await t.test('loads and applies default config file: pino-pretty.config.cjs', async (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const configFile = path.join(tmpDir, 'pino-pretty.config.cjs')
    fs.writeFileSync(configFile, 'module.exports = { translateTime: true }')
    // Tell the loader to expect ESM modules
    const packageJsonFile = path.join(tmpDir, 'package.json')
    fs.writeFileSync(packageJsonFile, JSON.stringify({ type: 'module' }, null, 4))
    const env = { TERM: ' dumb', TZ: 'UTC' }
    const child = spawn(process.argv[0], [bin], { env, cwd: tmpDir })
    // Validate that the time has been translated
    child.on('error', t.assert.fail)
    const endPromise = new Promise(resolve => {
      child.stdout.on('data', (data) => {
        t.assert.strictEqual(data.toString(), '[17:35:28.992] INFO (42): hello world\n')
        resolve()
      })
    })
    child.stdin.write(logLine)
    await endPromise
    t.after(() => {
      fs.unlinkSync(configFile)
      fs.unlinkSync(packageJsonFile)
      child.kill()
    })
  })

  await t.test('loads and applies default config file: .pino-prettyrc', async (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const configFile = path.join(tmpDir, '.pino-prettyrc')
    fs.writeFileSync(configFile, JSON.stringify({ translateTime: true }, null, 4))
    const env = { TERM: ' dumb', TZ: 'UTC' }
    const child = spawn(process.argv[0], [bin], { env, cwd: tmpDir })
    // Validate that the time has been translated
    child.on('error', t.assert.fail)
    const endPromise = new Promise(resolve => {
      child.stdout.on('data', (data) => {
        t.assert.strictEqual(data.toString(), '[17:35:28.992] INFO (42): hello world\n')
        resolve()
      })
    })
    child.stdin.write(logLine)
    await endPromise
    t.after(() => {
      fs.unlinkSync(configFile)
      child.kill()
    })
  })

  await t.test('loads and applies default config file: .pino-prettyrc.json', async (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const configFile = path.join(tmpDir, '.pino-prettyrc.json')
    fs.writeFileSync(configFile, JSON.stringify({ translateTime: true }, null, 4))
    const env = { TERM: ' dumb', TZ: 'UTC' }
    const child = spawn(process.argv[0], [bin], { env, cwd: tmpDir })
    // Validate that the time has been translated
    child.on('error', t.assert.fail)
    const endPromise = new Promise(resolve => {
      child.stdout.on('data', (data) => {
        t.assert.strictEqual(data.toString(), '[17:35:28.992] INFO (42): hello world\n')
        resolve()
      })
    })
    child.stdin.write(logLine)
    await endPromise
    t.after(() => {
      fs.unlinkSync(configFile)
      child.kill()
    })
  })

  await t.test('loads and applies custom config file: pino-pretty.config.test.json', async (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const configFile = path.join(tmpDir, 'pino-pretty.config.test.json')
    fs.writeFileSync(configFile, JSON.stringify({ translateTime: true }, null, 4))
    const env = { TERM: ' dumb', TZ: 'UTC' }
    const child = spawn(process.argv[0], [bin, '--config', configFile], { env, cwd: tmpDir })
    // Validate that the time has been translated
    child.on('error', t.assert.fail)
    const endPromise = new Promise(resolve => {
      child.stdout.on('data', (data) => {
        t.assert.strictEqual(data.toString(), '[17:35:28.992] INFO (42): hello world\n')
        resolve()
      })
    })
    child.stdin.write(logLine)
    await endPromise
    t.after(() => child.kill())
  })

  await t.test('loads and applies custom config file: pino-pretty.config.test.js', async (t) => {
    t.plan(1)
    // Set translateTime: true on run configuration
    const configFile = path.join(tmpDir, 'pino-pretty.config.test.js')
    fs.writeFileSync(configFile, 'module.exports = { translateTime: true }')
    const env = { TERM: ' dumb', TZ: 'UTC' }
    const child = spawn(process.argv[0], [bin, '--config', configFile], { env, cwd: tmpDir })
    // Validate that the time has been translated
    child.on('error', t.assert.fail)
    const endPromise = new Promise(resolve => {
      child.stdout.on('data', (data) => {
        t.assert.strictEqual(data.toString(), '[17:35:28.992] INFO (42): hello world\n')
        resolve()
      })
    })
    child.stdin.write(logLine)
    await endPromise
    t.after(() => child.kill())
  })

  await Promise.all(['--messageKey', '-m'].map(async (optionName) => {
    await t.test(`cli options override config options via ${optionName}`, async (t) => {
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
      const env = { TERM: ' dumb', TZ: 'UTC' }
      const child = spawn(process.argv[0], [bin, optionName, 'new_msg'], { env, cwd: tmpDir })
      // Validate that the time has been translated and correct message key has been used
      child.on('error', t.assert.fail)
      const endPromise = new Promise(resolve => {
        child.stdout.on('data', (data) => {
          t.assert.strictEqual(data.toString(), '[17:35:28.992] INFO (42): hello world\n')
          resolve()
        })
      })
      child.stdin.write(logLine.replace(/"msg"/, '"new_msg"'))
      await endPromise
      t.after(() => {
        fs.unlinkSync(configFile)
        child.kill()
      })
    })
  }))

  await t.test('cli options with defaults can be overridden by config', async (t) => {
    t.plan(1)
    // Set errorProps: '*' on run configuration
    const configFile = path.join(tmpDir, 'pino-pretty.config.js')
    fs.writeFileSync(configFile, `
      module.exports = {
          errorProps: '*'
      }
    `.trim())
    // Set messageKey: 'new_msg' using command line option
    const env = { TERM: ' dumb', TZ: 'UTC' }
    const child = spawn(process.argv[0], [bin], { env, cwd: tmpDir })
    // Validate that the time has been translated and correct message key has been used
    child.on('error', t.assert.fail)
    const endPromise = new Promise(resolve => {
      child.stdout.on('data', (data) => {
        t.assert.strictEqual(data.toString(), '[21:31:36.006] FATAL: There was an error starting the process.\n    QueryError: Error during sql query: syntax error at or near SELECTT\n        at /home/me/projects/example/sql.js\n        at /home/me/projects/example/index.js\n    querySql: SELECTT * FROM "test" WHERE id = $1;\n    queryArgs: 12\n')
        resolve()
      })
    })
    child.stdin.write('{"level":60,"time":1594416696006,"msg":"There was an error starting the process.","type":"Error","stack":"QueryError: Error during sql query: syntax error at or near SELECTT\\n    at /home/me/projects/example/sql.js\\n    at /home/me/projects/example/index.js","querySql":"SELECTT * FROM \\"test\\" WHERE id = $1;","queryArgs":[12]}\n')
    await endPromise
    t.after(() => {
      fs.unlinkSync(configFile)
      child.kill()
    })
  })

  await t.test('throws on missing config file', async (t) => {
    t.plan(2)
    const args = [bin, '--config', 'pino-pretty.config.missing.json']
    const env = { TERM: ' dumb', TZ: 'UTC' }
    const child = spawn(process.argv[0], args, { env, cwd: tmpDir })
    child.stdout.pipe(process.stdout)
    child.stderr.setEncoding('utf8')
    let data = ''
    child.stderr.on('data', (chunk) => {
      data += chunk
    })
    await new Promise(resolve => {
      child.on('close', function (code) {
        t.assert.strictEqual(code, 1)
        match(
          data.toString(), 'Error: Failed to load runtime configuration file: pino-pretty.config.missing.json', t)
        resolve()
      })
    })
    t.after(() => child.kill())
  })

  await t.test('throws on invalid default config file', async (t) => {
    t.plan(2)
    const configFile = path.join(tmpDir, 'pino-pretty.config.js')
    fs.writeFileSync(configFile, 'module.exports = () => {}')
    const env = { TERM: ' dumb', TZ: 'UTC' }
    const child = spawn(process.argv[0], [bin], { env, cwd: tmpDir })
    child.stdout.pipe(process.stdout)
    child.stderr.setEncoding('utf8')
    let data = ''
    child.stderr.on('data', (chunk) => {
      data += chunk
    })
    await new Promise(resolve => {
      child.on('close', function (code) {
        t.assert.strictEqual(code, 1)
        match(data, 'Error: Invalid runtime configuration file: pino-pretty.config.js', t)
        resolve()
      })
    })
    t.after(() => child.kill())
  })

  await t.test('throws on invalid custom config file', async (t) => {
    t.plan(2)
    const configFile = path.join(tmpDir, 'pino-pretty.config.invalid.js')
    fs.writeFileSync(configFile, 'module.exports = () => {}')
    const args = [bin, '--config', path.relative(tmpDir, configFile)]
    const env = { TERM: ' dumb', TZ: 'UTC' }
    const child = spawn(process.argv[0], args, { env, cwd: tmpDir })
    child.stdout.pipe(process.stdout)
    child.stderr.setEncoding('utf8')
    let data = ''
    child.stderr.on('data', (chunk) => {
      data += chunk
    })
    await new Promise(resolve => {
      child.on('close', function (code) {
        t.assert.strictEqual(code, 1)
        match(data, 'Error: Invalid runtime configuration file: pino-pretty.config.invalid.js', t)
        resolve()
      })
    })
    t.after(() => child.kill())
  })

  await t.test('test help', async (t) => {
    t.plan(1)
    const env = { TERM: ' dumb', TZ: 'UTC' }
    const child = spawn(process.argv[0], [bin, '--help'], { env })
    const file = fs.readFileSync('help/help.txt').toString()
    child.on('error', t.assert.fail)

    await new Promise(resolve => {
      child.stdout.on('data', (data) => {
        t.assert.strictEqual(data.toString(), file)
        resolve()
      })
    })
    t.after(() => child.kill())
  })
})
