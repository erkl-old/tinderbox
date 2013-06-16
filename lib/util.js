var crypto = require('crypto')

// closures waiting to acquire the global mutex lock
var queue = []

// waits for the global mutex lock to become available, then
// executes the closure
exports.lock = function (fn) {
  if (queue.push(fn) === 1) {
    queue[0](exports.once(exports.unlock))
  }
}

// frees the mutex lock and executes the next queued function
exports.unlock = function () {
  queue.shift()

  if (queue.length > 0) {
    queue[0](exports.once(exports.unlock))
  }
}

// consumes a binary stream to generate a sha1 hash
exports.sha1 = function (stream, callback) {
  var hash = crypto.createHash('sha1')

  stream.on('data', hash.update.bind(hash))
  stream.on('error', callback.bind(null, null))
  stream.on('end', function () {
    callback(null, hash.digest('hex'))
  })
}

// wraps a function in a closure which prevents it from being
// called more than once
exports.once = function (fn, context) {
  var called = false

  return function () {
    if (called) return
    called = true

    var args = Array.prototype.slice.call(arguments)
    return fn.apply(context || null, args)
  }
}
