'use strict'

process.env.TZ = 'UTC'

const tap = require('tap')
const { createCopier } = require('fast-copy')
const stringifySafe = require('fast-safe-stringify')
const { internals } = require('../../lib/utils')
const fastCopy = createCopier({})

tap.test('#joinLinesWithIndentation', t => {
  t.test('joinLinesWithIndentation adds indentation to beginning of subsequent lines', async t => {
    const input = 'foo\nbar\nbaz'
    const result = internals.joinLinesWithIndentation({ input })
    t.equal(result, 'foo\n    bar\n    baz')
  })

  t.test('joinLinesWithIndentation accepts custom indentation, line breaks, and eol', async t => {
    const input = 'foo\nbar\r\nbaz'
    const result = internals.joinLinesWithIndentation({ input, ident: '  ', eol: '^' })
    t.equal(result, 'foo^  bar^  baz')
  })

  t.end()
})

tap.test('#formatTime', t => {
  const dateStr = '2019-04-06T13:30:00.000-04:00'
  const epoch = new Date(dateStr)
  const epochMS = epoch.getTime()

  t.test('passes through epoch if `translateTime` is `false`', async t => {
    const formattedTime = internals.formatTime(epochMS)
    t.equal(formattedTime, epochMS)
  })

  t.test('translates epoch milliseconds if `translateTime` is `true`', async t => {
    const formattedTime = internals.formatTime(epochMS, true)
    t.equal(formattedTime, '17:30:00.000')
  })

  t.test('translates epoch milliseconds to UTC string given format', async t => {
    const formattedTime = internals.formatTime(epochMS, 'd mmm yyyy H:MM')
    t.equal(formattedTime, '6 Apr 2019 17:30')
  })

  t.test('translates epoch milliseconds to SYS:STANDARD', async t => {
    const formattedTime = internals.formatTime(epochMS, 'SYS:STANDARD')
    t.match(formattedTime, /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [-+]?\d{4}/)
  })

  t.test('translates epoch milliseconds to SYS:<FORMAT>', async t => {
    const formattedTime = internals.formatTime(epochMS, 'SYS:d mmm yyyy H:MM')
    t.match(formattedTime, /\d{1} \w{3} \d{4} \d{1,2}:\d{2}/)
  })

  t.test('passes through date string if `translateTime` is `false`', async t => {
    const formattedTime = internals.formatTime(dateStr)
    t.equal(formattedTime, dateStr)
  })

  t.test('translates date string if `translateTime` is `true`', async t => {
    const formattedTime = internals.formatTime(dateStr, true)
    t.equal(formattedTime, '17:30:00.000')
  })

  t.test('translates date string to UTC string given format', async t => {
    const formattedTime = internals.formatTime(dateStr, 'd mmm yyyy H:MM')
    t.equal(formattedTime, '6 Apr 2019 17:30')
  })

  t.test('translates date string to SYS:STANDARD', async t => {
    const formattedTime = internals.formatTime(dateStr, 'SYS:STANDARD')
    t.match(formattedTime, /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [-+]?\d{4}/)
  })

  t.test('translates date string to UTC:<FORMAT>', async t => {
    const formattedTime = internals.formatTime(dateStr, 'UTC:d mmm yyyy H:MM')
    t.equal(formattedTime, '6 Apr 2019 17:30')
  })

  t.test('translates date string to SYS:<FORMAT>', async t => {
    const formattedTime = internals.formatTime(dateStr, 'SYS:d mmm yyyy H:MM')
    t.match(formattedTime, /\d{1} \w{3} \d{4} \d{1,2}:\d{2}/)
  })

  t.end()
})

tap.test('#createDate', t => {
  const wanted = 1624450038567

  t.test('accepts arguments the Date constructor would accept', async t => {
    t.plan(2)
    t.same(internals.createDate(1624450038567).getTime(), wanted)
    t.same(internals.createDate('2021-06-23T12:07:18.567Z').getTime(), wanted)
  })

  t.test('accepts epoch as a string', async t => {
    // If Date() accepts this argument, the createDate function is not needed
    // and can be replaced with Date()
    t.plan(2)
    t.notSame(new Date('16244500385-67').getTime(), wanted)
    t.same(internals.createDate('1624450038567').getTime(), wanted)
  })

  t.end()
})

tap.test('#isValidDate', t => {
  t.test('returns true for valid dates', async t => {
    t.same(internals.isValidDate(new Date()), true)
  })

  t.test('returns false for non-dates and invalid dates', async t => {
    t.plan(2)
    t.same(internals.isValidDate('20210621'), false)
    t.same(internals.isValidDate(new Date('2021-41-99')), false)
  })

  t.end()
})

tap.test('#prettifyError', t => {
  t.test('prettifies error', t => {
    const error = Error('Bad error!')
    const lines = stringifySafe(error, Object.getOwnPropertyNames(error), 2)

    const prettyError = internals.prettifyError({ keyName: 'errorKey', lines, ident: '    ', eol: '\n' })
    t.match(prettyError, /\s*errorKey: {\n\s*"stack":[\s\S]*"message": "Bad error!"/)
    t.end()
  })

  t.end()
})

tap.test('#deleteLogProperty', t => {
  const logData = {
    level: 30,
    data1: {
      data2: { 'data-3': 'bar' }
    }
  }

  t.test('deleteLogProperty deletes property of depth 1', async t => {
    const log = fastCopy(logData)
    internals.deleteLogProperty(log, 'data1')
    t.same(log, { level: 30 })
  })

  t.test('deleteLogProperty deletes property of depth 2', async t => {
    const log = fastCopy(logData)
    internals.deleteLogProperty(log, 'data1.data2')
    t.same(log, { level: 30, data1: { } })
  })

  t.test('deleteLogProperty deletes property of depth 3', async t => {
    const log = fastCopy(logData)
    internals.deleteLogProperty(log, 'data1.data2.data-3')
    t.same(log, { level: 30, data1: { data2: { } } })
  })

  t.end()
})

tap.test('#splitPropertyKey', t => {
  t.test('splitPropertyKey does not change key', async t => {
    const result = internals.splitPropertyKey('data1')
    t.same(result, ['data1'])
  })

  t.test('splitPropertyKey splits nested key', async t => {
    const result = internals.splitPropertyKey('data1.data2.data-3')
    t.same(result, ['data1', 'data2', 'data-3'])
  })

  t.test('splitPropertyKey splits nested keys ending with a dot', async t => {
    const result = internals.splitPropertyKey('data1.data2.data-3.')
    t.same(result, ['data1', 'data2', 'data-3'])
  })

  t.test('splitPropertyKey splits nested escaped key', async t => {
    const result = internals.splitPropertyKey('logging\\.domain\\.corp/operation.foo.bar-2')
    t.same(result, ['logging.domain.corp/operation', 'foo', 'bar-2'])
  })

  t.test('splitPropertyKey splits nested escaped key with special characters', async t => {
    const result = internals.splitPropertyKey('logging\\.domain\\.corp/operation.!\t@#$%^&*()_+=-<>.bar\\.2')
    t.same(result, ['logging.domain.corp/operation', '!\t@#$%^&*()_+=-<>', 'bar.2'])
  })

  t.end()
})

tap.test('#getPropertyValue', t => {
  t.test('getPropertyValue returns the value of the property', async t => {
    const result = internals.getPropertyValue({
      foo: 'bar'
    }, 'foo')
    t.same(result, 'bar')
  })

  t.test('getPropertyValue returns the value of the nested property', async t => {
    const result = internals.getPropertyValue({ extra: { foo: { value: 'bar' } } }, 'extra.foo.value')
    t.same(result, 'bar')
  })

  t.test('getPropertyValue returns the value of the nested property using the array of nested property keys', async t => {
    const result = internals.getPropertyValue({ extra: { foo: { value: 'bar' } } }, ['extra', 'foo', 'value'])
    t.same(result, 'bar')
  })

  t.test('getPropertyValue returns undefined for non-existing properties', async t => {
    const result = internals.getPropertyValue({ extra: { foo: { value: 'bar' } } }, 'extra.foo.value-2')
    t.same(result, undefined)
  })

  t.test('getPropertyValue returns undefined for non-existing properties using the array of nested property keys', async t => {
    const result = internals.getPropertyValue({ extra: { foo: { value: 'bar' } } }, ['extra', 'foo', 'value-2'])
    t.same(result, undefined)
  })

  t.end()
})

tap.test('#interpretConditionals', t => {
  const logData = {
    level: 30,
    data1: {
      data2: 'bar'
    },
    msg: 'foo'
  }

  t.test('interpretConditionals translates if / else statement to found property value', async t => {
    const log = fastCopy(logData)
    t.equal(internals.interpretConditionals('{level} - {if data1.data2}{data1.data2}{end}', log), '{level} - bar')
  })

  t.test('interpretConditionals translates if / else statement to found property value and leave unmatched property key untouched', async t => {
    const log = fastCopy(logData)
    t.equal(internals.interpretConditionals('{level} - {if data1.data2}{data1.data2} ({msg}){end}', log), '{level} - bar ({msg})')
  })

  t.test('interpretConditionals removes non-terminated if statements', async t => {
    const log = fastCopy(logData)
    t.equal(internals.interpretConditionals('{level} - {if data1.data2}{data1.data2}', log), '{level} - {data1.data2}')
  })

  t.test('interpretConditionals removes floating end statements', async t => {
    const log = fastCopy(logData)
    t.equal(internals.interpretConditionals('{level} - {data1.data2}{end}', log), '{level} - {data1.data2}')
  })

  t.test('interpretConditionals removes floating end statements within translated if / end statements', async t => {
    const log = fastCopy(logData)
    t.equal(internals.interpretConditionals('{level} - {if msg}({msg}){end}{end}', log), '{level} - (foo)')
  })

  t.test('interpretConditionals removes if / end blocks if existent condition key does not match existent property key', async t => {
    const log = fastCopy(logData)
    t.equal(internals.interpretConditionals('{level}{if msg}{data1.data2}{end}', log), '{level}')
  })

  t.test('interpretConditionals removes if / end blocks if non-existent condition key does not match existent property key', async t => {
    const log = fastCopy(logData)
    t.equal(internals.interpretConditionals('{level}{if foo}{msg}{end}', log), '{level}')
  })

  t.test('interpretConditionals removes if / end blocks if existent condition key does not match non-existent property key', async t => {
    const log = fastCopy(logData)
    t.equal(internals.interpretConditionals('{level}{if msg}{foo}{end}', log), '{level}')
  })

  t.test('interpretConditionals removes if / end blocks if non-existent condition key does not match non-existent property key', async t => {
    const log = fastCopy(logData)
    t.equal(internals.interpretConditionals('{level}{if foo}{bar}{end}', log), '{level}')
  })

  t.test('interpretConditionals removes if / end blocks if nested condition key does not match property key', async t => {
    const log = fastCopy(logData)
    t.equal(internals.interpretConditionals('{level}{if data1.msg}{data1.data2}{end}', log), '{level}')
  })

  t.test('interpretConditionals removes nested if / end statement blocks', async t => {
    const log = fastCopy(logData)
    t.equal(internals.interpretConditionals('{if msg}{if data1.data2}{msg}{data1.data2}{end}{end}', log), 'foo{data1.data2}')
  })

  t.end()
})
