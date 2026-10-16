'use strict'

/* eslint-disable no-control-regex */

const { test } = require('node:test')
const stringifySafe = require('fast-safe-stringify')
const colors = require('../colors')
const prettifyObject = require('./prettify-object')
const {
  ERROR_LIKE_KEYS
} = require('../constants')

const context = {
  EOL: '\n',
  IDENT: '    ',
  customPrettifiers: {},
  errorLikeObjectKeys: ERROR_LIKE_KEYS,
  objectColorizer: colors(),
  singleLine: false,
  colorizer: colors()
}

test('returns empty string if no properties present', t => {
  const str = prettifyObject({ log: {}, context })
  t.assert.strictEqual(str, '')
})

test('works with single level properties', t => {
  const str = prettifyObject({ log: { foo: 'bar' }, context })
  t.assert.strictEqual(str, '    foo: "bar"\n')
})

test('strips unsafe control characters from property names', t => {
  const str = prettifyObject({ log: { 'foo\u001B[2J\u009B[3J': 'bar' }, context })
  t.assert.strictEqual(str, '    foo[2J[3J: "bar"\n')
})

test('works with multiple level properties', t => {
  const str = prettifyObject({ log: { foo: { bar: 'baz' } }, context })
  t.assert.strictEqual(str, '    foo: {\n      "bar": "baz"\n    }\n')
})

test('skips specified keys', t => {
  const str = prettifyObject({
    log: { foo: 'bar', hello: 'world' },
    skipKeys: ['foo'],
    context
  })
  t.assert.strictEqual(str, '    hello: "world"\n')
})

test('ignores predefined keys', t => {
  const str = prettifyObject({ log: { foo: 'bar', pid: 12345 }, context })
  t.assert.strictEqual(str, '    foo: "bar"\n')
})

test('ignores escaped backslashes in string values', t => {
  const str = prettifyObject({ log: { foo_regexp: '\\[^\\w\\s]\\' }, context })
  t.assert.strictEqual(str, '    foo_regexp: "\\[^\\w\\s]\\"\n')
})

test('ignores escaped backslashes in string values (singleLine option)', t => {
  const str = prettifyObject({
    log: { foo_regexp: '\\[^\\w\\s]\\' },
    context: {
      ...context,
      singleLine: true
    }
  })
  t.assert.strictEqual(str, '{"foo_regexp":"\\[^\\w\\s]\\"}\n')
})

test('works with error props', t => {
  const err = Error('Something went wrong')
  const serializedError = {
    message: err.message,
    stack: err.stack
  }
  const str = prettifyObject({ log: { error: serializedError }, context })
  t.assert.ok(str.startsWith('    error:'))
  t.assert.ok(str.includes('     "message": "Something went wrong",'))
  t.assert.ok(str.includes('         Error: Something went wrong'))
})

test('customPrettifiers gets applied', t => {
  const customPrettifiers = {
    foo: v => v.toUpperCase()
  }
  const str = prettifyObject({
    log: { foo: 'foo' },
    context: {
      ...context,
      customPrettifiers
    }
  })
  t.assert.strictEqual(str.startsWith('    foo: FOO'), true)
})

test('skips lines omitted by customPrettifiers', t => {
  const customPrettifiers = {
    foo: () => { return undefined }
  }
  const str = prettifyObject({
    log: { foo: 'foo', bar: 'bar' },
    context: {
      ...context,
      customPrettifiers
    }
  })
  t.assert.strictEqual(str.includes('bar: "bar"'), true)
  t.assert.strictEqual(str.includes('foo: "foo"'), false)
})

test('joined lines omits starting eol', t => {
  const str = prettifyObject({
    log: { msg: 'doing work', calls: ['step 1', 'step 2', 'step 3'], level: 30 },
    context: {
      ...context,
      IDENT: '',
      customPrettifiers: {
        calls: val => '\n' + val.map(it => '  ' + it).join('\n')
      }
    }
  })
  t.assert.strictEqual(str, [
    'msg: "doing work"',
    'calls:',
    '  step 1',
    '  step 2',
    '  step 3',
    ''
  ].join('\n'))
})

test('errors skips prettifiers', t => {
  const customPrettifiers = {
    err: () => { return 'is_err' }
  }
  const str = prettifyObject({
    log: { err: Error('boom') },
    context: {
      ...context,
      customPrettifiers
    }
  })
  t.assert.strictEqual(str.includes('err: is_err'), true)
})

test('preserves control characters produced by a custom error prettifier', t => {
  const colorizer = colors(true)
  const customPrettifiers = {
    err: (_value, _key, _log, { colors }) => stringifySafe({
      stack: colors.red('Error: boom')
    }, null, 2)
  }
  const str = prettifyObject({
    log: { err: Error('boom') },
    context: {
      ...context,
      colorizer,
      customPrettifiers
    }
  })
  t.assert.strictEqual(str.includes(colorizer.colors.red('Error: boom')), true)
})

test('errors skips prettifying if no lines are present', t => {
  const customPrettifiers = {
    err: () => { return undefined }
  }
  const str = prettifyObject({
    log: { err: Error('boom') },
    context: {
      ...context,
      customPrettifiers
    }
  })
  t.assert.strictEqual(str, '')
})

test('works with single level properties', t => {
  const colorizer = colors(true)
  const str = prettifyObject({
    log: { foo: 'bar' },
    context: {
      ...context,
      objectColorizer: colorizer,
      colorizer
    }
  })
  t.assert.strictEqual(str, `    ${colorizer.colors.magenta('foo')}: "bar"\n`)
})

test('works with customColors', t => {
  const colorizer = colors(true, [])
  t.assert.doesNotThrow(() => {
    prettifyObject({
      log: { foo: 'bar' },
      context: {
        ...context,
        objectColorizer: colorizer,
        colorizer
      }
    })
  })
})

test('customColors gets applied', t => {
  const colorizer = colors(true, [['property', 'green']])
  const str = prettifyObject({
    log: { foo: 'bar' },
    context: {
      ...context,
      objectColorizer: colorizer,
      colorizer
    }
  })
  t.assert.strictEqual(str, `    ${colorizer.colors.green('foo')}: "bar"\n`)
})

test('syntax highlights json in singleLine mode when objectColorizer is active', t => {
  const colorizer = colors(true)
  const str = prettifyObject({
    log: { foo: 'bar', num: 42, bool: true, nil: null },
    context: {
      ...context,
      singleLine: true,
      objectColorizer: colorizer,
      colorizer
    }
  })
  // Must NOT be wrapped in a single grey color
  t.assert.strictEqual(str.startsWith('\u001B[90m{'), false)
  // Must contain redBright string key
  t.assert.match(str, /\u001B\[91m"foo"\u001B\[39m/)
  // Must contain greenBright string value
  t.assert.match(str, /\u001B\[92m"bar"\u001B\[39m/)
  // Must contain yellow number literal
  t.assert.match(str, /\u001B\[33m42\u001B\[39m/)
  // Must contain cyan boolean literal
  t.assert.match(str, /\u001B\[36mtrue\u001B\[39m/)
  // Must contain white null literal
  t.assert.match(str, /\u001B\[37mnull\u001B\[39m/)
  // Stripping ANSI should yield valid single-line JSON
  t.assert.strictEqual(str.replace(/\u001B\[\d+m/g, ''), '{"foo":"bar","num":42,"bool":true,"nil":null}\n')
})

test('syntax highlights nested objects and arrays in singleLine mode', t => {
  const colorizer = colors(true)
  const str = prettifyObject({
    log: { nested: { arr: [1, 'two', { three: true }] } },
    context: {
      ...context,
      singleLine: true,
      objectColorizer: colorizer,
      colorizer
    }
  })
  // Inner array brackets
  t.assert.match(str, /\u001B\[94m\[\u001B\[39m/)
  // Inner number in array
  t.assert.match(str, /\u001B\[33m1\u001B\[39m/)
  // Inner string in array
  t.assert.match(str, /\u001B\[92m"two"\u001B\[39m/)
  // Inner nested key
  t.assert.match(str, /\u001B\[91m"three"\u001B\[39m/)
  // Inner boolean
  t.assert.match(str, /\u001B\[36mtrue\u001B\[39m/)
  // Stripped ANSI matches clean JSON
  t.assert.strictEqual(str.replace(/\u001B\[\d+m/g, ''), '{"nested":{"arr":[1,"two",{"three":true}]}}\n')
})

test('handles escaped quotes, backslashes, trailing backslashes, and Unicode in singleLine mode', t => {
  const colorizer = colors(true)
  const str = prettifyObject({
    log: {
      quote: 'hello "world"',
      trailing: 'test\\',
      both: 'a\\b "c" \n d',
      unicode: '日本語 🚀'
    },
    context: {
      ...context,
      singleLine: true,
      objectColorizer: colorizer,
      colorizer
    }
  })
  // Must remain valid and untruncated
  t.assert.match(str, /"hello \\"world\\""/)
  t.assert.match(str, /"test\\"/)
  t.assert.match(str, /"日本語 🚀"/)
  // Stripped ANSI matches clean single line
  const stripped = str.replace(/\u001B\[\d+m/g, '')
  t.assert.strictEqual(
    stripped,
    '{"quote":"hello \\"world\\"","trailing":"test\\","both":"a\\b \\"c\\" \\n d","unicode":"日本語 🚀"}\n'
  )
})

test('renders empty objects and arrays in singleLine mode without crashing', t => {
  const colorizer = colors(true)
  const str = prettifyObject({
    log: { emptyObj: {}, emptyArr: [] },
    context: {
      ...context,
      singleLine: true,
      objectColorizer: colorizer,
      colorizer
    }
  })
  t.assert.match(str, /\u001B\[92m\{\u001B\[39m\u001B\[92m\}\u001B\[39m/)
  t.assert.match(str, /\u001B\[94m\[\u001B\[39m\u001B\[94m\]\u001B\[39m/)
  t.assert.strictEqual(str.replace(/\u001B\[\d+m/g, ''), '{"emptyObj":{},"emptyArr":[]}\n')
})

test('handles circular references safely in singleLine mode', t => {
  const colorizer = colors(true)
  const circular = { a: 1 }
  circular.self = circular
  const str = prettifyObject({
    log: circular,
    context: {
      ...context,
      singleLine: true,
      objectColorizer: colorizer,
      colorizer
    }
  })
  t.assert.match(str, /"\[Circular\]"/)
  t.assert.strictEqual(str.replace(/\u001B\[\d+m/g, ''), '{"a":1,"self":{"a":1,"self":"[Circular]"}}\n')
})

test('produces zero ANSI escape codes when colorize is false in singleLine mode', t => {
  const plainColorizer = colors(false)
  const str = prettifyObject({
    log: { foo: 'bar', num: 42, bool: true, nil: null, nested: { a: [1] } },
    context: {
      ...context,
      singleLine: true,
      objectColorizer: plainColorizer,
      colorizer: plainColorizer
    }
  })
  // Zero ANSI escape codes
  t.assert.strictEqual(/\u001B\[\d+m/.test(str), false)
  t.assert.strictEqual(str, '{"foo":"bar","num":42,"bool":true,"nil":null,"nested":{"a":[1]}}\n')
})

test('produces zero ANSI escape codes in object when colorizeObjects is false in singleLine mode', t => {
  const activeColorizer = colors(true)
  const objectColorizer = colors(false, [], false)
  const str = prettifyObject({
    log: { foo: 'bar', num: 42, bool: true, nil: null },
    context: {
      ...context,
      singleLine: true,
      objectColorizer,
      colorizer: activeColorizer
    }
  })
  // Zero ANSI escape codes in object payload
  t.assert.strictEqual(/\u001B\[\d+m/.test(str), false)
  t.assert.strictEqual(str, '{"foo":"bar","num":42,"bool":true,"nil":null}\n')
})

test('preserves customPrettifiers in singleLine mode', t => {
  const colorizer = colors(true)
  const str = prettifyObject({
    log: { foo: 'hello', bar: 'world' },
    context: {
      ...context,
      singleLine: true,
      objectColorizer: colorizer,
      colorizer,
      customPrettifiers: {
        foo: val => val.toUpperCase()
      }
    }
  })
  t.assert.match(str, /"HELLO"/)
  t.assert.strictEqual(str.replace(/\u001B\[\d+m/g, ''), '{"foo":"HELLO","bar":"world"}\n')
})
