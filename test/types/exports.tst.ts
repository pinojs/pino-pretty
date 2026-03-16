import { expect, test } from 'tstyche'

import type PinoPretty from '../../index.js'
import PinoPrettyDefault, { PinoPretty as PinoPrettyNamed } from '../../index.js'
import * as PinoPrettyStar from '../../index.js'
import PinoPrettyCjsImport = require('../../index.js')

declare const options: PinoPretty.PrettyOptions

test('exports', () => {
  expect(PinoPrettyDefault(options)).type.toBe<PinoPretty.PrettyStream>()
  expect(PinoPrettyNamed(options)).type.toBe<PinoPretty.PrettyStream>()
  expect(PinoPrettyStar.PinoPretty(options)).type.toBe<PinoPretty.PrettyStream>()
  expect(PinoPrettyCjsImport.PinoPretty(options)).type.toBe<PinoPretty.PrettyStream>()
})
