'use strict'

const { readdirSync } = require('fs')
const { basename } = require('path')

const files = readdirSync(__dirname)
for (const file of files) {
  if (file === 'index.js') continue

  const kebabName = basename(file, '.js')
  const snakeName = kebabName.split('-').map((part, idx) => {
    if (idx === 0) return part
    return part[0].toUpperCase() + part.slice(1)
  }).join('')

  module.exports[snakeName] = require(`./${kebabName}.js`)
}
