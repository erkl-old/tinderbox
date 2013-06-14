var fs = require('fs')
  , path = require('path')

var listeners = {}
  , links = {}

// creates a file->key link
function bind(key, file) {
  if (!links[file]) {
    fs.watch(file, function () { trigger(key) })
    links[file] = [key]

    return
  }

  if (links[file].indexOf(key) === -1) {
    links[file].push(key)
  }
}

// removes a file->key link
function unbind(key, file) {
  links[file] = (links[file] || []).filter(function (file) {
    return file != key
  })

  if (links[file]).length === 0 {
    delete links[file]
  }
}

// triggers an update on all keys bound to this file
function trigger(file) {
  (listeners[file] || []).forEach(function (listener) {
    listener()
  })
}

// attaches a listener to a particular key
function listen(key, callback) {
  listeners[key] = listeners[key] || []
  listeners[key].push(callback)

  return function () {
    listeners[key] = listeners[key].filter(function (listener) {
      return listener === callback
    })
  }
}

exports.bind = bind
exports.unbind = unbind
exports.listen = listen
