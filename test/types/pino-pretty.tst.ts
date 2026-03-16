import { expect, test } from 'tstyche'

import colorette from 'colorette'
import pino from 'pino'
import pretty, {
  build,
  colorizerFactory,
  isColorSupported,
  MessageFormatFunc,
  PinoPretty,
  Prettifier,
  prettyFactory,
  PrettyOptions,
  PrettyStream
} from '../../index.js'

declare const options: PrettyOptions

test('default export', () => {
  expect(pretty()).type.toBe<PrettyStream>()
  expect(pretty(options)).type.toBe<PrettyStream>()
})

test('build', () => {
  expect(build()).type.toBe<PrettyStream>()
  expect(build(options)).type.toBe<PrettyStream>()
})

test('PinoPretty', () => {
  expect(PinoPretty()).type.toBe<PrettyStream>()
  expect(PinoPretty(options)).type.toBe<PrettyStream>()
})

test('PrettyStream', () => {
  const stream = pretty()
  pino(stream)

  expect<PrettyStream>().type.toBeAssignableTo<pino.DestinationStream>()
})

test('prettyFactory', () => {
  expect(prettyFactory(options)).type.toBe<(inputData: any) => string>()
  expect(prettyFactory).type.not.toBeCallableWith()
})

test('colorizerFactory', () => {
  const colorizer = colorizerFactory()

  let useColors: boolean | undefined
  expect(colorizerFactory(useColors)).type.toBe(colorizer)

  let customColors: [number, string][] | undefined
  expect(colorizerFactory(undefined, customColors)).type.toBe(colorizer)

  let useOnlyCustomProps: boolean | undefined
  expect(colorizerFactory(undefined, undefined, useOnlyCustomProps)).type.toBe(colorizer)

  const input: string | number = ''
  expect(colorizer.message(input)).type.toBe<string>()
  expect(colorizer.greyMessage(input)).type.toBe<string>()

  let level: string | number | undefined
  expect(colorizer(level)).type.toBe<string>()

  let customLevels: { [level: number]: string } | undefined
  expect(colorizer(undefined, { customLevels })).type.toBe<string>()

  let customLevelNames: { [name: string]: number } | undefined
  expect(colorizer(undefined, { customLevelNames })).type.toBe<string>()
})

test('isColorSupported', () => {
  expect(isColorSupported).type.toBe<boolean>()
})

test('PrettyOptions', () => {
  expect<PrettyOptions>().type.toBeAssignableFrom({ colorize: true })
  expect<PrettyOptions>().type.toBeAssignableFrom({ colorizeObjects: true })
  expect<PrettyOptions>().type.toBeAssignableFrom({ crlf: false })
  expect<PrettyOptions>().type.toBeAssignableFrom({ errorLikeObjectKeys: ['err', 'error'] })
  expect<PrettyOptions>().type.toBeAssignableFrom({ errorProps: '' })
  expect<PrettyOptions>().type.toBeAssignableFrom({ levelFirst: false })
  expect<PrettyOptions>().type.toBeAssignableFrom({ messageKey: 'msg' })
  expect<PrettyOptions>().type.toBeAssignableFrom({ levelKey: 'level' })
  expect<PrettyOptions>().type.toBeAssignableFrom({ messageFormat: false as const })
  expect<PrettyOptions>().type.toBeAssignableFrom({ messageFormat: '{levelLabel} - {pid} - url:{req.url}' })

  const messageFormat: MessageFormatFunc = (log, messageKey, levelLabel, { colors }) => {
    expect(log).type.toBe<Record<string, unknown>>()
    expect(messageKey).type.toBe<string>()
    expect(levelLabel).type.toBe<string>()
    expect(colors).type.toBe<colorette.Colorette>()

    return ''
  }

  expect<PrettyOptions>().type.toBeAssignableFrom({ messageFormat })
  expect<PrettyOptions>().type.toBeAssignableFrom({ timestampKey: 'time' })
  expect<PrettyOptions>().type.toBeAssignableFrom({ translateTime: false })
  expect<PrettyOptions>().type.toBeAssignableFrom({ translateTime: 'SYS:standard' })
  expect<PrettyOptions>().type.toBeAssignableFrom({ ignore: 'pid,hostname' })
  expect<PrettyOptions>().type.toBeAssignableFrom({ include: 'level,time' })
  expect<PrettyOptions>().type.toBeAssignableFrom({ hideObject: false })
  expect<PrettyOptions>().type.toBeAssignableFrom({ singleLine: false })
  expect<PrettyOptions>().type.toBeAssignableFrom({ customColors: 'err:red,info:blue' })
  expect<PrettyOptions>().type.toBeAssignableFrom({ customColors: { info: 'white', some_level: 'red' } })
  expect<PrettyOptions>().type.toBeAssignableFrom({ customLevels: 'err:99,info:1' })
  expect<PrettyOptions>().type.toBeAssignableFrom({ customLevels: { info: 10, some_level: 40 } })
  expect<PrettyOptions>().type.toBeAssignableFrom({ levelLabel: 'levelLabel' })
  expect<PrettyOptions>().type.toBeAssignableFrom<{ minimumLevel: pino.Level }>()
  expect<PrettyOptions>().type.toBeAssignableFrom({ useOnlyCustomProps: true })
  expect<PrettyOptions>().type.toBeAssignableFrom({ destination: '1' })
  expect<PrettyOptions>().type.toBeAssignableFrom({ destination: 1 })
  expect<PrettyOptions>().type.toBeAssignableFrom<{ destination: pino.DestinationStream }>()
  expect<PrettyOptions>().type.toBeAssignableFrom<{ destination: NodeJS.WritableStream }>()

  expect<PrettyOptions>().type.toBeAssignableFrom({ sync: false })
  expect<PrettyOptions>().type.toBeAssignableFrom({ append: true })
  expect<PrettyOptions>().type.toBeAssignableFrom({ mkdir: true })

  const levelPrettifier: Prettifier = (input, key, log, { colors, label, labelColorized }) => {
    expect(input).type.toBe<string | object>()
    expect(key).type.toBe<string>()
    expect(log).type.toBe<object>()
    expect(colors).type.toBe<colorette.Colorette>()
    expect(label).type.toBe<string>()
    expect(labelColorized).type.toBe<string>()

    return input.toString()
  }

  const customPrettifiers: Record<string, Prettifier> = {
    time: timestamp => `🕰 ${timestamp}`,
    level: logLevel => `LEVEL: ${logLevel}`,
    name: (name, _key, _log, { colors }) => `${colors.blue(name.toString())}`,
  }

  expect<PrettyOptions>().type.toBeAssignableFrom({ customPrettifiers: { level: levelPrettifier } })
  expect<PrettyOptions>().type.toBeAssignableFrom({ customPrettifiers })
})
