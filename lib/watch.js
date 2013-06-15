var events = require('events')
  , fs = require('fs')
  , path = require('path')

var handle = new events.EventEmitter()
  , dependencies = {}
  , watchers = {}
  , changed = {}

// define (or redefine) a key's file dependencies
function register(key, files) {
  var existing = dependencies[key] || []

  // update all affected watchers
  missing(existing, files).forEach(unbind.bind(null, key))
  missing(files, existing).forEach(bind.bind(null, key))

  dependencies[key] = files
}

// generates an array of all values present in the first array
// but not the second
function missing(one, two) {
  return one.filter(function (v) {
    return two.indexOf(v) === -1
  })
}

// establishes a new `file`->`key` link
function bind(key, file) {
  if (watchers[file] == null) {
    watchers[file] = new Watcher(file, [])
  }

  watchers[file].keys.push(file)
}

// removes a `file`->`key` link
function unbind(key, file) {
  var watcher = watchers[file]
  if (watcher == null) return

  watcher.keys = watcher.keys.filter(function (k) {
    return key != k
  })

  if (watcher.keys.length === 0) {
    watcher.close()
    delete watchers[file]
  }
}

// a Watcher takes care of triggering change events each time
// a file changes
function Watcher(file, keys) {
  this.file = file
  this.keys = keys
  this.timeout = null
  this.watcher = null

  this.watch()
}

// watch tries to subscribe to file changes using `fs.watch`, falling
// back to polling the file at a set interval if it doesn't exist yet
Watcher.prototype.watch = function () {
  var self = this

  try {
    self.watcher = fs.watch(self.file, { persistent: false })
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }

    // wait for the file to be created
    self.wait()
    return
  }

  self.watcher.on('error', function (err) {
    self.watcher.close()
    self.wait()
  })

  self.watcher.on('change', function (event, filename) {
    if (event === 'rename') {
      self.watcher.close()
      self.wait()
    }

    self.trigger()
  })
}

// polls the file-system at a set interval, creating a
// full-fledged watcher as soon as the file can be found
Watcher.prototype.wait = function () {
  var self = this

  function check() {
    fs.stat(self.file, function (err, stats) {
      if (err != null) {
        self.timeout = setTimeout(check, 10)
        return
      }

      clearTimeout(self.timeout)

      self.trigger()
      self.watch()
    })
  }

  setTimeout(check, 5)
}

// flags all this file's keys as modified, and flush them
// after a small delay
Watcher.prototype.trigger = function () {
  this.keys.forEach(function (key) {
    clearTimeout(changed[key])

    changed[key] = setTimeout(function () {
      handle.emit('update', key)
    }, 30)
  })
}

// disables the watcher
Watcher.prototype.close = function () {
  if (this.timeout != null) {
    clearTimeout(this.timeout)
    this.timeout = null
  }

  if (this.watcher != null) {
    this.watcher.close()
    this.watcher = null
  }

  delete watchers[this.file]
}

handle.register = register
module.exports = handle
