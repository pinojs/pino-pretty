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


<a id="usage"></a>
## Usage

It's recommended to use `pino-pretty` with `pino` 
by piping output to the CLI tool: 

```sh
pino app.js | pino-pretty
```

<a id="cliargs"></a>
### CLI Arguments

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
date and time string. This flag also can set the format string to apply when
translating the date to human readable format. For a list of available pattern
letters see the [`dateformat`](https://www.npmjs.com/package/dateformat) documentation.
  - The default format is `yyyy-mm-dd HH:MM:ss.l o` in UTC.
  - Require a `SYS:` prefix to translate time to the local system's timezone. A
    shortcut `SYS:standard` to translate time to `yyyy-mm-dd HH:MM:ss.l o` in
    system timezone.
+ `--search` (`-s`): Specifiy a search pattern according to
  [jmespath](http://jmespath.org/).

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
This factory function is used internally by pino, and accepts an options argument
with keys corresponding to the options described in [CLI Arguments](#cliargs):

```js
{
  colorize: chalk.supportsColor, // --colorize
  crlf: false, // --crlf
  errorLikeObjectKeys: ['err', 'error'], // --errorLikeObjectKeys
  errorProps: '', // --errorProps
  levelFirst: false, // --levelFirst, Ignored if `format` is provided
  messageKey: 'msg', // --messageKey
  translateTime: false, // --translateTime
  search: 'foo == `bar`', // --search
  ignoreKeys: ['v'], // Allow's you to ignore log entry keys from output.  Not available from cli
  format: [ // Configurable format of the log up to when the message is appended, not available from cli
      { delimiter: '[', requireAllKeys: ['time'] },
      { key: 'time' },
      { delimiter: '] ', requireAllKeys: ['time'] },
      { key: 'level' }
      { delimiter: ' (', requireOneOfKeys: ['name', 'pid', 'hostname'] },
      { key: 'name' },
      { delimiter: '/', requireAllKeys: ['name', 'pid'] },
      { key: 'pid' },
      { delimiter: ' on ', requireAllKeys: ['hostname'] },
      { key: 'hostname' },
      { delimiter: ')', requireOneOfKeys: ['name', 'pid', 'hostname'] },
      { delimiter: ': ' },
  ]
}
```

<a id="options-colorize"><a>
#### `colorize` (Boolean)

Default: `chalk.supportsColor`

Will colorize the output using chalk.  The `colorize` default follows
[`chalk.supportsColor](https://www.npmjs.com/package/chalk#chalksupportscolor).

<a id="options-crlf"><a>
#### `crlf` (Boolean)

Default: `false`

A boolean value to enable/disable adding both carriage return and line endings at the end of each line.  False will only include line endings

<a id="options-error-like-object-keys"><a>
#### `errorLikeObjectKeys` (Array<String>)

Default: `['err','error']`

Define the log keys that are associated with error like objects.

<a id="options-error-props"><a>
#### `errorProps` (Array<String>)

Default: `[]`

When formatting an error object, include the properties listed here.  To show all properties on the error object, set this to `['*']`
```javascript
{
  errorProps: ['*']
}
```

<a id="options-level-first"><a>
#### `levelFirst` (Boolean)

Default: `false`

Swaps the placement of the `time` and `level` keys in each log line.

> This setting is ignored if the `format` property is set

##### true
```bash
INFO [1522431328992] (42 on foo): hello world
```
##### false
```bash
[1522431328992] INFO (42 on foo): hello world
```

<a id="options-message-key"><a>
#### `messageKey` (String)

Default: `msg`

The key in your log entry that will be used when appending the message to the first line

<a id="options-translate-time"><a>
#### `translateTime` (Boolean | String)

Default: `false`

Whether or not to translate the time from an epoch timestamp to a formated time string

##### true
```bash
INFO [2018-03-30 10:35:28.992 -0700] (42 on foo): hello world
```
> Uses [dateformat](https://www.npmjs.com/package/dateformat) string of `'yyyy-mm-dd HH:MM:ss.l o'`

##### string
Will apply a [dateformat](https://www.npmjs.com/package/dateformat) string to the log entry timestamp
```javascript
{
  translateTime: 'yyyy-mm-dd HH:MM:ss'
}
```
will result in:
```bash
INFO [2018-03-30 10:35:28] (42 on foo): hello world
```

##### false
Renders the epoch time
```bash
INFO [1522431328992] (42 on foo): hello world
```

<a id="options-search"><a>
#### `search` (String)
A [jmespath](http://jmespath.org/) query string to filter your logs.

<a id="options-advanced"><a>
### Advanced Options

<a id="options-ignore-keys"><a>
#### `ignoreKeys` (Array<String>)

Default: `['v']`

You can specify the log entry keys that should be ignored from output.  By default, all keys will be output except for the internal 'v' key entry.

<a id="options-format"><a>
#### `format` (Array<Object>)
Allows formatting of the first log line by specifying the placement of delimiters and keys.  This allows you to tap into the default formatting logic of pino-pretty so you can easily customize your log entries based on the properties that you include in your loggers.

The pino logger will automatically attempt to bind the following keys to a log entry:
| key      	| description |
|----------	|-----------	|
| level    	| The log level |
| time     	| Epoch timestamp |
| name     	| The process name if available |
| pid      	| The process pid |
| hostname 	| The hostname of server where the application is running |
| v        	| The pino log entry version 	|

You can also bind as many properties to a log message or a logger via various apis.  This formatter will allow you to specify how each of the available keys will be logged in the first line, as well as how delimiters should be displayed depending on what log keys are available.

##### key
By specifiying a key entry in your format object, you are telling pino-pretty to attempt to output the value of this key in the log entry if available.

```javascript
interface KeyToken {
  key: string;
}
```

##### delimiters
Delimiters allow you to specify a string to place in your log output.  You can also add conditions to each delimiter to specify if it should be output or not based on the presence of certain keys in your log entry.

```javascript
interface DelimiterToken {
  // The delimiter to include in the log output
  delimiter: string;
  // If specified, will require that at least one of the keys in the array are present for the delimiter to be in the output
  requireOneOfKeys?: string[]
  // If specified, will require that all of the keys in the array are present for the delimiter to be in the output
  requireAllKeys?: string[]
}
```

##### Breaking it down
Let's start with a simple example to explain how this can be used:

For every example below, we'll be formatting this log entry:
```bash
{"level":30,"time":1522431328992,"msg":"hello world","pid":42,"hostname":"foo","v":1}
```

Here are some very basic options to start with:
```javascript
{
  format: [
    { key: 'level' }
  ]
}
```
This tells pino-pretty that it should only render the `level` key entry in our first line.  This is what the log output looks like:

```bash
INFO: hello world
    time: 1522431328992
    pid: 42
    hostname: "foo"
```
What's happened is that the log line includes the `level` key only, pino-pretty will now continue outputting all the keys bound to the log entry that aren't ignored.  By default the `ignoreKeys` property is set to ignore the `v` option only.

We can clean that output up if we care to by ignoring some keys.  Here's a new set of options
```javascript
{
  ignoreKeys: ['time', 'pid', 'hostname'],
  format: [
    { key: 'level' }
  ]
}
```

Now our log output looks like this:

```bash
INFO: hello world
```

Let's take this a step further and add delimiters.  Let's say that I would like all my logs to include information about what application is running.

```javascript
{
  ignoreKeys: ['time', 'pid', 'hostname'],
  format: [
    { key: 'level' },
    { delimiter: ' [app:log-test]' }
  ]
}
```
Now our log output looks like this

```bash
INFO [app:log-test]: hello world
```

It starts to get fun when we add in some delimiter conditions.  Let's say that we want to add a new key and ensure that it's cuddled by brackets _if_ that key exists.

```javascript
{
  ignoreKeys: ['time', 'pid', 'hostname'],
  format: [
    { key: 'level' },
    { delimiter: ' [app:log-test]' },
    { delimiter: ' [', requireAllKeys: ['class'] },
    { key: 'class' },
    { delimiter: ']', requireAllKeys: ['class'] }
  ]
}
```
Now let's look at the output based on these log entries:
With these new adjustments we don't see a change to the originl log entry
Input:
```bash
{"level":30,"time":1522431328992,"msg":"hello world","pid":42,"hostname":"foo","v":1}
```
Output:
```bash
INFO [app:log-test]: hello world
```
But with a new log entry that has the `class` property set, we see some new information
Input:
```bash
{"level":30,"time":1522431328992,"msg":"request sent","pid":42,"hostname":"foo","v":1, "class":"HTTPClient"}
```
Output:
```bash
INFO [app:log-test] [HTTPClient]: request sent
```

Let's get crazy now and see how we can have it show the class or method within those cuddled brackets:

```javascript
{
  ignoreKeys: ['time', 'pid', 'hostname'],
  format: [
    { key: 'level' },
    { delimiter: ' [app:log-test]' },
    { delimiter: ' [', requireOneOfKeyss: ['class', 'method'] },
    { key: 'class' },
    { delimiter: ':', requireAllKeys: ['class', 'method'] },
    { key: 'method' },
    { delimiter: ']', requireOneOfKeyss: ['class', 'method'] }
  ]
}
```
This will ensure that if we bind either or both `class` or `method` keys to the log entry, then we'll see the entries conditionally.  With the previous log entries that we analyzed before, the output is unchanged.

But a new log entry like so would now output the method with the class.
Input:
```bash
{"level":30,"time":1522431328992,"msg":"request sent","pid":42,"hostname":"foo","v":1, "class":"HTTPClient", "method": "send"}
```
Output:
```bash
INFO [app:log-test] [HTTPClient:send]: request sent
```

And if we omitted the class from the log entry then we would see this
Input:
```bash
{"level":30,"time":1522431328992,"msg":"request sent","pid":42,"hostname":"foo","v":1, "method": "send"}
```
Output:
```bash
INFO [app:log-test] [send]: request sent
```
That's it, with these options you can easily modify the log output with some simple tokens.  This is the default pino-pretty format when the `levelFirst` option is false

```javascript
[
  // Will only render if the 'time' key is present
  { delimiter: '[', requireAllKeys: ['time'] }, 
  { key: 'time' },
   // Will only render if the 'time' key is present
  { delimiter: '] ', requireAllKeys: ['time'] },
  { key: 'level' }
  // Will only render if any of the following keys are present 'name', 'pid', 'hostname'
  { delimiter: ' (', requireOneOfKeys: ['name', 'pid', 'hostname'] },
  { key: 'name' },
  // Will only render if any of the following keys are present 'name', 'pid'
  { delimiter: '/', requireAllKeys: ['name', 'pid'] },
  { key: 'pid' },
  // Will only render if any of the following keys are present 'hostname'
  { delimiter: ' on ', requireAllKeys: ['hostname'] },
  { key: 'hostname' },
  // Will only render if any of the following keys are present 'name', 'pid', 'hostname'
  { delimiter: ')', requireOneOfKeys: ['name', 'pid', 'hostname'] },
  // Will always render
  { delimiter: ': ' }
]
```

<a id="license"><a>
## License

MIT License
