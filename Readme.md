<a id="intro"></a>
# pino-pretty

[![Build Status](https://travis-ci.org/pinojs/pino-pretty.svg?branch=master)](https://travis-ci.org/pinojs/pino-pretty)
[![Coverage Status](https://coveralls.io/repos/github/pinojs/pino-pretty/badge.svg?branch=master)](https://coveralls.io/github/pinojs/pino-pretty?branch=master)

This module provides a basic [ndjson](http://ndjson.org/) formatter. If an
incoming line looks like it could be a log line from an ndjson logger, in
particular the [Pino](https://getpino.io/) logging library, then it will apply
extra formatting by considering things like the log level and timestamp.

A standard Pino log line like:

```
{"level":30,"time":1522431328992,"msg":"hello world","pid":42,"hostname":"foo","v":1}
```

Will format to:

```
[1522431328992] INFO (42 on foo): hello world
```

<a id="example"></a>
## Example

Using the [example script][exscript] from the Pino module, and specifying
that logs should be colored and the time translated, we can see what the
prettified logs will look like:

![demo](demo.png)

[exscript]: https://github.com/pinojs/pino/blob/fc4c83b/example.js

<a id="install"></a>
## Install

```sh
$ npm install -g pino-pretty
```

<a id="usage"></a>
## Usage

It's recommended to use `pino-pretty` with `pino`
by piping output to the CLI tool:

```sh
pino app.js | pino-pretty
```

<a id="cliargs"></a>
### CLI Arguments

- `--colorize` (`-c`): Adds terminal color escape sequences to the output.
- `--crlf` (`-f`): Appends carriage return and line feed, instead of just a line
  feed, to the formatted log line.
- `--errorProps` (`-e`): When formatting an error object, display this list
  of properties. The list should be a comma separated list of properties Default: `''`.
- `--levelFirst` (`-l`): Display the log level name before the logged date and time.
- `--errorLikeObjectKeys` (`-k`): Define the log keys that are associated with
  error like objects. Default: `err,error`.
- `--messageKey` (`-m`): Define the key that contains the main log message.
  Default: `msg`.
- `--timestampKey` (`-m`): Define the key that contains the log timestamp.
  Default: `time`.  
- `--translateTime` (`-t`): Translate the epoch time value into a human readable
  date and time string. This flag also can set the format string to apply when
  translating the date to human readable format. For a list of available pattern
  letters see the [`dateformat` documentation](https://www.npmjs.com/package/dateformat).
  - The default format is `yyyy-mm-dd HH:MM:ss.l o` in UTC.
  - Require a `SYS:` prefix to translate time to the local system's timezone. A
    shortcut `SYS:standard` to translate time to `yyyy-mm-dd HH:MM:ss.l o` in
    system timezone.
- `--search` (`-s`): Specify a search pattern according to
  [jmespath](http://jmespath.org/).
- `--ignore` (`-i`): Ignore one or several keys: (`-i time,hostname`)

<a id="integration"></a>
## Programmatic Integration

We recommend against using `pino-pretty` in production, and highly
recommend installing `pino-pretty` as a development dependency.

When installed, `pino-pretty` will be used by `pino` as the default
prettifier.

Install `pino-pretty` alongside `pino` and set the
`prettyPrint` option to `true`:

```js
const pino = require('pino')
const logger = pino({
  prettyPrint: true
})

logger.info('hi')
```

The `prettyPrint` option can also be an object containing `pretty-print`
options:

```js
const pino = require('pino')
const logger = pino({
  prettyPrint: { colorize: true }
})

logger.info('hi')
```

See the [Options](#options) section for all possible options.

<a id="options"></a>
### Options

`pino-pretty` exports a factory function that can be used to format log strings.
This factory function is used internally by Pino, and accepts an options argument
with keys corresponding to the options described in [CLI Arguments](#cliargs):

```js
{
  colorize: chalk.supportsColor, // --colorize
  crlf: false, // --crlf
  errorLikeObjectKeys: ['err', 'error'], // --errorLikeObjectKeys
  errorProps: '', // --errorProps
  levelFirst: false, // --levelFirst
  messageKey: 'msg', // --messageKey
  timestampKey: 'time', // --timestampKey
  translateTime: false, // --translateTime
  search: 'foo == `bar`', // --search
  ignore: 'pid,hostname', // --ignore
  logParsers: undefined,
  lineBuilders: undefined
}
```

The `colorize` default follows
[`chalk.supportsColor`](https://www.npmjs.com/package/chalk#chalksupportscolor).

Note: the `logParsers` and `lineBuilders` options do not correspond to CLI arguments.
They are available only for API usage, as described below.

#### log parsers

Log parsers are simple functions that parse the log. `pino-pretty` uses a number
of built-in log parsers.

The `logParsers` option accepts an array of functions, which are appended to the
built-in log parser functions and therefore executed immediately after them. This
provides an opportunity to further modify the formatted log output by supplying
custom log parser functions.

The log parser function reeives two parameters:`input` and `context`.
* The `input` object represents the output of the previously-executed parsers
* The `context` object has a number of properties that are helpful in custom
  parsers, including the following:

  - `opts`: the options passed to the formatter
  - `EOL`: the actual end-of-line characters, as specified by the `crlf` option
  - `IDENT`: the default indentation string

The log parser function returns a result object with two properties: `output` and `done`.

  - `output`: the parsed string
  - `done`: a boolean value that causes the formatter to abort the parsing process,
    returning `output` as the final formatted output

The following is an example of a minimal log parser function:

```js
function (input, context) {
  // parse/transform the input
  const output = input.toLowerCase()
  return { output }
}
```

To short-circuit the parsing process and prevent subsequent log parsers from being executed,
set `done` to `true`:

```js
function (input, context) {
  return {
    output: input.toLowerCase(),
    done: true // short-circuit the log parsing process
  }
}
```

#### line builders

Line builders are simple functions that prepare the final formatted line and are executed
after the log parsers. `pino-pretty` uses a number of built-in line builders.

The `lineBuilders` option accepts an array of functions, which are appended to the
built-in line builder functions and therefore executed immediately after them. This
provides an opportunity to further modify the formatted log output by supplying
custom line builder functions.

The log parser function reeives two parameters:`lineParts` and `context`.
* The `lineParts` array contains the ordered list of strings that will eventually be joined
* The `context` object is the same `context` object passed to the log parser functions,
  though it also has a few additional properties that are helpful in custom line builders,
  including the following:

  - `log`: the final output produced by the log parsers
  - `prettified`: a number of strings prettified before the line builders run, including
    `prettifiedLevel`, `prettifiedMessage`, `prettifiedMetadata`, `prettifiedTime`

The line builder function does not return a value. To change the output, modify the
`lineParts` array.

Note that if a log parser short-circuits the parsing process, the line builders will
not be executed at all.

The following is an example of a minimal line builder function:

```js
function (lineParts) {
  // add a value to the array
  lineParts.push('NEW VALUE')
}
```

The following is an example of a more complex line builder function, based on one of
the built-in line builders.

```js
function (lineParts, { prettified }) => {
  const { prettifiedTime } = prettified
  if (prettifiedTime) {
    if (lineParts.length > 0) {
      lineParts.push(' ')
    }
    lineParts.push(prettifiedTime)
  }
},
```

<a id="license"><a>
## License

MIT License
