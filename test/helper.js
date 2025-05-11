'use strict'

function once (obj, event, fn) {
  return new Promise(resolve => {
    obj.on(event, (...args) => {
      fn(...args)
      resolve()
    })
  })
}

module.exports = { once }
