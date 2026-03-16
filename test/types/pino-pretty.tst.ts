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

test('MessageFormatFunc', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const messageFormat: MessageFormatFunc = (log, messageKey, levelLabel, extras) => {
    expect(log).type.toBe<Record<string, unknown>>()
    expect(messageKey).type.toBe<string>()
    expect(levelLabel).type.toBe<string>()
    expect(extras.colors).type.toBe<Colorette>()
    expect(extras.label).type.toBe<string>()
    expect(extras.labelColorized).type.toBe<string>()

    return ''
  }
})

test('PinoPretty', () => {
  expect(PinoPretty()).type.toBe<PrettyStream>()
  expect(PinoPretty(options)).type.toBe<PrettyStream>()
})

test('Prettifier', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const prettifier: Prettifier = (input, key, log, extras) => {
    expect(input).type.toBe<string | object>()
    expect(key).type.toBe<string>()
    expect(log).type.toBe<object>()
    expect(extras.colors).type.toBe<colorette.Colorette>()
    expect(extras.label).type.toBe<string>()
    expect(extras.labelColorized).type.toBe<string>()

    return input.toString()
  }
})

test('PrettyOptions', () => {
  expect<PrettyOptions>().type.toBeAssignableFrom({})

  expect<Pick<PrettyOptions, 'hideObject'>>().type.toBe<{
    hideObject?: boolean;
  }>()

  expect<Pick<PrettyOptions, 'translateTime'>>().type.toBe<{
    translateTime?: boolean | string;
  }>()

  expect<Pick<PrettyOptions, 'levelFirst'>>().type.toBe<{
    levelFirst?: boolean;
  }>()

  expect<Pick<PrettyOptions, 'levelKey'>>().type.toBe<{
    levelKey?: string;
  }>()

  expect<Pick<PrettyOptions, 'levelLabel'>>().type.toBe<{
    levelLabel?: string;
  }>()

  expect<Pick<PrettyOptions, 'messageKey'>>().type.toBe<{
    messageKey?: string;
  }>()

  expect<Pick<PrettyOptions, 'singleLine'>>().type.toBe<{
    singleLine?: boolean;
  }>()

  expect<Pick<PrettyOptions, 'timestampKey'>>().type.toBe<{
    timestampKey?: string;
  }>()

  expect<Pick<PrettyOptions, 'minimumLevel'>>().type.toBe<{
    minimumLevel?: pino.Level;
  }>()

  expect<Pick<PrettyOptions, 'messageFormat'>>().type.toBe<{
    messageFormat?: false | string | MessageFormatFunc;
  }>()

  expect<Pick<PrettyOptions, 'colorize'>>().type.toBe<{
    colorize?: boolean;
  }>()

  expect<Pick<PrettyOptions, 'colorizeObjects'>>().type.toBe<{
    colorizeObjects?: boolean;
  }>()

  expect<Pick<PrettyOptions, 'crlf'>>().type.toBe<{
    crlf?: boolean;
  }>()

  expect<Pick<PrettyOptions, 'errorLikeObjectKeys'>>().type.toBe<{
    errorLikeObjectKeys?: string[];
  }>()

  expect<Pick<PrettyOptions, 'errorProps'>>().type.toBe<{
    errorProps?: string;
  }>()

  expect<Pick<PrettyOptions, 'ignore'>>().type.toBe<{
    ignore?: string;
  }>()

  expect<Pick<PrettyOptions, 'include'>>().type.toBe<{
    include?: string;
  }>()

  expect<Pick<PrettyOptions, 'sync'>>().type.toBe<{
    sync?: boolean;
  }>()

  expect<Pick<PrettyOptions, 'destination'>>().type.toBe<{
    destination?: string | number | pino.DestinationStream | NodeJS.WritableStream;
  }>()

  expect<Pick<PrettyOptions, 'append'>>().type.toBe<{
    append?: boolean;
  }>()

  expect<Pick<PrettyOptions, 'mkdir'>>().type.toBe<{
    mkdir?: boolean;
  }>()

  expect<Pick<PrettyOptions, 'customPrettifiers'>>().type.toBe<{
    customPrettifiers?: Record<string, Prettifier> & { level?: Prettifier };
  }>()

  expect<Pick<PrettyOptions, 'customLevels'>>().type.toBe<{
    customLevels?: string | object;
  }>()

  expect<Pick<PrettyOptions, 'customColors'>>().type.toBe<{
    customColors?: string | object;
  }>()

  expect<Pick<PrettyOptions, 'useOnlyCustomProps'>>().type.toBe<{
    useOnlyCustomProps?: boolean;
  }>()
})

test('prettyFactory', () => {
  expect(prettyFactory(options)).type.toBe<(inputData: any) => string>()
  expect(prettyFactory).type.not.toBeCallableWith()
})

test('PrettyStream', () => {
  expect<PrettyStream>().type.toBeAssignableTo<pino.DestinationStream>()
})
