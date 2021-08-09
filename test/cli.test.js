'use strict'

const path = require('path')
const spawn = require('child_process').spawn
const test = require('tap').test

const bin = require.resolve(path.join(__dirname, '..', 'bin.js'))
const epoch = 1522431328992
const logLine = '{"level":30,"time":1522431328992,"msg":"hello world","pid":42,"hostname":"foo"}\n'

test('cli', (t) => {
  t.test('does basic reformatting', (t) => {
    t.plan(1)
    const env = { TERM: 'dumb' }
    const child = spawn(process.argv[0], [bin], { env })
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.equal(data.toString(), `[${epoch}] INFO (42 on foo): hello world\n`)
    })
    child.stdin.write(logLine)
    t.teardown(() => child.kill())
  })

  ;['--levelFirst', '-l'].forEach((optionName) => {
    t.test(`flips epoch and level via ${optionName}`, (t) => {
      t.plan(1)
      const env = { TERM: 'dumb' }
      const child = spawn(process.argv[0], [bin, optionName], { env })
      child.on('error', t.threw)
      child.stdout.on('data', (data) => {
        t.equal(data.toString(), `INFO [${epoch}] (42 on foo): hello world\n`)
      })
      child.stdin.write(logLine)
      t.teardown(() => child.kill())
    })
  })

  ;['--translateTime', '-t'].forEach((optionName) => {
    t.test(`translates time to default format via ${optionName}`, (t) => {
      t.plan(1)
      const env = { TERM: 'dumb' }
      const child = spawn(process.argv[0], [bin, optionName], { env })
      child.on('error', t.threw)
      child.stdout.on('data', (data) => {
        t.equal(data.toString(), '[2018-03-30 17:35:28.992 +0000] INFO (42 on foo): hello world\n')
      })
      child.stdin.write(logLine)
      t.teardown(() => child.kill())
    })
  })

  ;['--search', '-s'].forEach((optionName) => {
    t.test(`does search via ${optionName}`, (t) => {
      t.plan(1)
      const env = { TERM: 'dumb' }
      const child = spawn(process.argv[0], [bin, optionName, 'msg == `hello world`'], { env })
      child.on('error', t.threw)
      child.stdout.on('data', (data) => {
        t.equal(data.toString(), `[${epoch}] INFO (42 on foo): hello world\n`)
      })
      child.stdin.write(logLine)
      t.teardown(() => child.kill())
    })
  })

  t.test('does search but finds only 1 out of 2', (t) => {
    t.plan(1)
    const env = { TERM: 'dumb' }
    const child = spawn(process.argv[0], [bin, '-s', 'msg == `hello world`'], { env })
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.equal(data.toString(), `[${epoch}] INFO (42 on foo): hello world\n`)
    })
    child.stdin.write(logLine.replace('hello world', 'hello universe'))
    child.stdin.write(logLine)
    t.teardown(() => child.kill())
  })

  ;['--ignore', '-i'].forEach((optionName) => {
    t.test('does ignore multiple keys', (t) => {
      t.plan(1)
      const env = { TERM: 'dumb' }
      const child = spawn(process.argv[0], [bin, optionName, 'pid,hostname'], { env })
      child.on('error', t.threw)
      child.stdout.on('data', (data) => {
        t.equal(data.toString(), '[1522431328992] INFO: hello world\n')
      })
      child.stdin.write(logLine)
      t.teardown(() => child.kill())
    })
  })

  t.test('does ignore escaped keys', (t) => {
    t.plan(1)
    const env = { TERM: 'dumb' }
    const child = spawn(process.argv[0], [bin, '-i', 'log\\.domain\\.corp/foo'], { env })
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.equal(data.toString(), '[1522431328992] INFO: hello world\n')
    })
    const logLine = '{"level":30,"time":1522431328992,"msg":"hello world","log.domain.corp/foo":"bar"}\n'
    child.stdin.write(logLine)
    t.teardown(() => child.kill())
  })

  t.test('passes through stringified date as string', (t) => {
    t.plan(1)
    const env = { TERM: 'dumb' }
    const child = spawn(process.argv[0], [bin], { env })
    child.on('error', t.threw)

    const date = JSON.stringify(new Date(epoch))

    child.stdout.on('data', (data) => {
      t.equal(data.toString(), date + '\n')
    })

    child.stdin.write(date)
    child.stdin.write('\n')

    t.teardown(() => child.kill())
  })

  ;['--timestampKey', '-a'].forEach((optionName) => {
    t.test(`uses specified timestamp key via ${optionName}`, (t) => {
      t.plan(1)
      const env = { TERM: 'dumb' }
      const child = spawn(process.argv[0], [bin, optionName, '@timestamp'], { env })
      child.on('error', t.threw)
      child.stdout.on('data', (data) => {
        t.equal(data.toString(), '[1522431328992] INFO: hello world\n')
      })
      const logLine = '{"level":30,"@timestamp":1522431328992,"msg":"hello world"}\n'
      child.stdin.write(logLine)
      t.teardown(() => child.kill())
    })
  })

  ;['--singleLine', '-S'].forEach((optionName) => {
    t.test(`singleLine=true via ${optionName}`, (t) => {
      t.plan(1)
      const logLineWithExtra = JSON.stringify(Object.assign(JSON.parse(logLine), {
        extra: {
          foo: 'bar',
          number: 42
        }
      })) + '\n'

      const env = { TERM: 'dumb' }
      const child = spawn(process.argv[0], [bin, optionName], { env })
      child.on('error', t.threw)
      child.stdout.on('data', (data) => {
        t.equal(data.toString(), `[${epoch}] INFO (42 on foo): hello world {"extra":{"foo":"bar","number":42}}\n`)
      })
      child.stdin.write(logLineWithExtra)
      t.teardown(() => child.kill())
    })
  })

  t.test('does ignore nested keys', (t) => {
    t.plan(1)

    const logLineNested = JSON.stringify(Object.assign(JSON.parse(logLine), {
      extra: {
        foo: 'bar',
        number: 42,
        nested: {
          foo2: 'bar2'
        }
      }
    })) + '\n'

    const env = { TERM: 'dumb' }
    const child = spawn(process.argv[0], [bin, '-S', '-i', 'extra.foo,extra.nested,extra.nested.miss'], { env })
    child.on('error', t.threw)
    child.stdout.on('data', (data) => {
      t.equal(data.toString(), `[${epoch}] INFO (42 on foo): hello world {"extra":{"number":42}}\n`)
    })
    child.stdin.write(logLineNested)
    t.teardown(() => child.kill())
  })

  t.end()
})
