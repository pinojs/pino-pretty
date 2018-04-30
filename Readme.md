<a id="intro"></a>
# pino-pretty
[![Build Status](https://travis-ci.org/pinojs/pino-pretty.svg?branch=master)](https://travis-ci.org/pinojs/pino-pretty)
[![Coverage Status](https://coveralls.io/repos/github/pinojs/pino-pretty/badge.svg?branch=master)](https://coveralls.io/github/pinojs/pino-pretty?branch=master)

This module provides a basic log prettifier for the [Pino](https://getpino.io/)
logging library. It reads a standard Pino log line like:

```
{"level":30,"time":1522431328992,"msg":"hello world","pid":42,"hostname":"foo","v":1}
```

And formats it to:

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

<a id="cliargs"></a>
## CLI Arguments

+ `--colorize` (`-c`): Adds terminal color escape sequences to the output.
+ `--crlf` (`-f`): Appends carriage return and line feed, instead of just a line
feed, to the formatted log line.
+ `--errorProps` (`-e`): When formatting an error object, display this list
of properties. The list should be a comma separated list of properties Default: `''`.
+ `--levelFirst` (`-l`): Display the log level name before the logged date and time.
+ `--errorLikeObjectKeys` (`-k`): Define the log keys that are associated with
error like objects. Default: `err,error`.
+ `--messageKey` (`-m`): Define the key that contains the main log message.
Default: `msg`.
+ `--translateTime` (`-t`): Translate the epoch time value into a human readable
date and time string in `UTC`. The default pattern is `'yyyy-mm-dd HH:MM:ss.l o'`.
If you want to translate to the local system's timezone, then you must prefix the format
string with `SYS:`, e.g. `'SYS:yyyy-mm-dd HH:MM:ss'`. See [`dateformat` documentation](https://www.npmjs.com/package/dateformat#mask-options)
for more available pattern letters.
+ `--search` (`-s`): Specifiy a search pattern according to
  [jmespath](http://jmespath.org/).

<a id="api"></a>
## API

`pino-pretty` exports a factory function that can be used to format log strings.
It accepts an options argument with keys corresponding to the options described
in [CLI Arguments](#cliargs):

```js
{
  colorize: false, // --colorize
  crlf: false, // --crlf
  errorLikeObjectKeys: ['err', 'error'], // --errorLikeObjectKeys
  errorProps: '', // --errorProps
  levelFirst: false, // --levelFirst
  messageKey: 'msg', // --messageKey
  translateTime: false, // --translateTime
  search: 'foo == `bar`' // --search
}
```

See the [Pino's prettifier documentation](#usemetadata) for information on how
to use this directly with `pino`.

[#usemetadata]: https://getpino.io/#/docs/pretty

<a id="license"><a>
## License

MIT License
