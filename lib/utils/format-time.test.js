'use strict'

process.env.TZ = 'UTC'

const { test } = require('node:test')
const formatTime = require('./format-time')

const dateStr = '2019-04-06T13:30:00.000-04:00'
const epoch = new Date(dateStr)
const epochMS = epoch.getTime()

test('passes through epoch if `translateTime` is `false`', t => {
  const formattedTime = formatTime(epochMS)
  t.assert.strictEqual(formattedTime, epochMS)
})

test('passes through epoch if date is invalid', t => {
  const input = 'this is not a date'
  const formattedTime = formatTime(input, true)
  t.assert.strictEqual(formattedTime, input)
})

test('translates epoch milliseconds if `translateTime` is `true`', t => {
  const formattedTime = formatTime(epochMS, true)
  t.assert.strictEqual(formattedTime, '17:30:00.000')
})

test('translates epoch milliseconds to UTC string given format', t => {
  const formattedTime = formatTime(epochMS, 'd mmm yyyy H:MM')
  t.assert.strictEqual(formattedTime, '6 Apr 2019 17:30')
})

test('translates epoch milliseconds to SYS:STANDARD', t => {
  const formattedTime = formatTime(epochMS, 'SYS:STANDARD')
  t.assert.match(formattedTime, /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [-+]?\d{4}/)
})

test('translates epoch milliseconds to SYS:<FORMAT>', t => {
  const formattedTime = formatTime(epochMS, 'SYS:d mmm yyyy H:MM')
  t.assert.match(formattedTime, /\d{1} \w{3} \d{4} \d{1,2}:\d{2}/)
})

test('passes through date string if `translateTime` is `false`', t => {
  const formattedTime = formatTime(dateStr)
  t.assert.strictEqual(formattedTime, dateStr)
})

test('translates date string if `translateTime` is `true`', t => {
  const formattedTime = formatTime(dateStr, true)
  t.assert.strictEqual(formattedTime, '17:30:00.000')
})

test('translates date string to UTC string given format', t => {
  const formattedTime = formatTime(dateStr, 'd mmm yyyy H:MM')
  t.assert.strictEqual(formattedTime, '6 Apr 2019 17:30')
})

test('translates date string to SYS:STANDARD', t => {
  const formattedTime = formatTime(dateStr, 'SYS:STANDARD')
  t.assert.match(formattedTime, /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [-+]?\d{4}/)
})

test('translates date string to UTC:<FORMAT>', t => {
  const formattedTime = formatTime(dateStr, 'UTC:d mmm yyyy H:MM')
  t.assert.strictEqual(formattedTime, '6 Apr 2019 17:30')
})

test('translates date string to SYS:<FORMAT>', t => {
  const formattedTime = formatTime(dateStr, 'SYS:d mmm yyyy H:MM')
  t.assert.match(formattedTime, /\d{1} \w{3} \d{4} \d{1,2}:\d{2}/)
})

test('translates epoch milliseconds to the given time zone if `translateTime` is `true`', t => {
  const formattedTime = formatTime(epochMS, true, 'America/Los_Angeles')
  t.assert.strictEqual(formattedTime, '10:30:00.000')
})

test('translates epoch milliseconds to SYS:STANDARD in the given time zone', t => {
  const formattedTime = formatTime(epochMS, 'SYS:STANDARD', 'America/Los_Angeles')
  t.assert.strictEqual(formattedTime, '2019-04-06 10:30:00.000 -0700')
})

test('uses the standard time offset of the given time zone outside daylight saving time', t => {
  const formattedTime = formatTime('2019-01-15T17:30:00.000Z', 'SYS:STANDARD', 'America/Los_Angeles')
  t.assert.strictEqual(formattedTime, '2019-01-15 09:30:00.000 -0800')
})

test('translates epoch milliseconds to SYS:<FORMAT> in the given time zone', t => {
  const formattedTime = formatTime(epochMS, 'SYS:d mmm yyyy H:MM', 'Asia/Tokyo')
  t.assert.strictEqual(formattedTime, '7 Apr 2019 2:30')
})

test('prints the offset and name of the given time zone', t => {
  const formattedTime = formatTime(epochMS, 'SYS:HH:MM o p Z', 'Asia/Kolkata')
  t.assert.strictEqual(formattedTime, '23:00 +0530 +05:30 GMT+5:30')
})

test('keeps quoted text in the format when using a time zone', t => {
  const formattedTime = formatTime(epochMS, "SYS:'o' HH:MM o", 'Europe/Berlin')
  t.assert.strictEqual(formattedTime, 'o 19:30 +0200')
})

test('supports named dateformat masks with a time zone', t => {
  const formattedTime = formatTime(epochMS, 'SYS:isoDateTime', 'Asia/Kathmandu')
  t.assert.strictEqual(formattedTime, '2019-04-06T23:15:00+0545')
})

test('does not apply the time zone to UTC formats', t => {
  t.assert.strictEqual(formatTime(epochMS, 'UTC:HH:MM o', 'America/Los_Angeles'), '17:30 +0000')
  t.assert.strictEqual(formatTime(epochMS, 'HH:MM', 'America/Los_Angeles'), '17:30')
  t.assert.strictEqual(formatTime(epochMS, 'SYS:isoUtcDateTime', 'America/Los_Angeles'), '2019-04-06T17:30:00Z')
})

test('uses the default dateformat mask for an empty SYS: format with a time zone', t => {
  const formattedTime = formatTime(epochMS, 'SYS:', 'Asia/Tokyo')
  t.assert.strictEqual(formattedTime, 'Sun Apr 07 2019 02:30:00')
})

test('handles years before year 1 with a time zone', t => {
  const formattedTime = formatTime('-000001-12-31T20:00:00.000Z', 'SYS:mm-dd HH:MM o', 'Etc/GMT-9')
  t.assert.strictEqual(formattedTime, '01-01 05:00 +0900')
})

test('does not throw at the end of the Date range with a time zone', t => {
  const formattedTime = formatTime(8.64e15, 'SYS:yyyy', 'Asia/Tokyo')
  t.assert.strictEqual(typeof formattedTime, 'string')
})
