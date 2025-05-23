'use strict'

const { test } = require('node:test')
const index = require('./index.js')
const { readdirSync } = require('node:fs')
const { basename } = require('node:path')

test(
  'index exports exactly all non-test files excluding itself',
  t => {
    // Read all files in the `util` directory
    const files = readdirSync(__dirname)

    for (const file of files) {
      const kebabName = basename(file, '.js')
      const snakeName = kebabName.split('-').map((part, idx) => {
        if (idx === 0) return part
        return part[0].toUpperCase() + part.slice(1)
      }).join('')

      if (file.endsWith('.test.js') === false && file !== 'index.js') {
        // We expect all files to be exported except…
        t.assert.ok(index[snakeName], `exports ${snakeName}`)
      } else {
        // …test files and the index file itself – those must not be exported
        t.assert.ok(!index[snakeName], `does not export ${snakeName}`)
      }

      // Remove the exported file from the index object
      delete index[snakeName]
    }

    // Now the index is expected to be empty, as nothing else should be
    // exported from it
    t.assert.deepStrictEqual(index, {}, 'does not export anything else')
  }
)
