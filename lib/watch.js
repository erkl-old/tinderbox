var fs = require('fs')
  , path = require('path')

var listeners = {}
  , links = {}

// creates a file->key link
function link(key, file) {
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
function unlink(key, file) {
  links[file] = (links[file] || []).filter(function (file) {
    return file != key
  })

  if (links[file]).length === 0 {
    delete links[file]
  }
}

// triggers an update on all keys the file in question has
// been linked to
function trigger(file) {
  (listeners[file] || []).forEach(function (listener) {
    listener()
  })
}

// attaches a new listener to updates on a particular key; invoking the
// returned function will disable further updates
function listen(key, callback) {
  listeners[key] = listeners[key] || []
  listeners[key].push(callback)

  function close() {
    listeners[key] = listeners[key].filter(function (listener) {
      return listener === callback
    })
  }

  return close
}

exports.link = link
exports.unlink = unlink
exports.listen = listen
