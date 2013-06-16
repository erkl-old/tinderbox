var events = require('events')
  , fs = require('fs')
  , path = require('path')
  , crypto = require('crypto')

var handle = new events.EventEmitter()
  , dependencies = {}
  , watchers = {}
  , changed = {}

// define (or redefine) an URL's file dependencies
function register(url, files) {
  var existing = dependencies[url] || []

  // update all affected watchers
  missing(existing, files).forEach(unbind.bind(null, url))
  missing(files, existing).forEach(bind.bind(null, url))

  dependencies[url] = files
}

// generates an array of all values present in the first array
// but not the second
function missing(one, two) {
  return one.filter(function (v) {
    return two.indexOf(v) === -1
  })
}

// establishes a new `file`->`url` link
function bind(url, file) {
  if (watchers[file] == null) {
    watchers[file] = new Watcher(file, [])
  }

  watchers[file].urls.push(file)
}

// removes a `file`->`url` link
function unbind(url, file) {
  var watcher = watchers[file]
  if (watcher == null) return

  watcher.urls = watcher.urls.filter(function (k) {
    return url != k
  })

  if (watcher.urls.length === 0) {
    watcher.close()
    delete watchers[file]
  }
}

// a Watcher takes care of triggering change events each time
// a file changes
function Watcher(file, urls) {
  this.file = file
  this.urls = urls
  this.timeout = null
  this.watcher = null

  var self = this
    , stream = fs.createReadStream(file)

  sha1(stream, function (err, hash) {
    self.hash = hash
    self.watch()
  })
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

// flags all this file's urls as modified, and flush them
// after a small delay
Watcher.prototype.trigger = function () {
  var self = this
    , stream = fs.createReadStream(self.file)

  sha1(stream, function (err, hash) {
    if (hash === self.hash) return

    self.urls.forEach(function (url) {
      clearTimeout(changed[url])

      changed[url] = setTimeout(function () {
        handle.emit('update', url)
      }, 30)
    })

    self.hash = hash
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

// consumes a binary stream to generate a sha1 hash
function sha1(stream, callback) {
  var hash = crypto.createHash('sha1')

  stream.on('data', hash.update.bind(hash))
  stream.on('error', callback.bind(null, null))
  stream.on('end', function () {
    callback(null, hash.digest('hex'))
  })
}

handle.register = register
module.exports = handle
