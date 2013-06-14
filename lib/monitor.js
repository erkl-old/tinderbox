var fs = require('fs')
  , path = require('path')

var listeners = []
  , funcs =
    [ 'open'
    , 'openSync'
    , 'readFile'
    , 'readFileSync'
    , 'stat'
    , 'statSync'
    ]

// wrap all functions we want to monitor
funcs.forEach(function (name, i) {
  var original = fs[name]

  fs[name] = function (file) {
    listeners.forEach(function (listener) {
      listener.add(path.resolve(process.cwd(), file))
    })

    var args = Array.prototype.slice.call(arguments)
    return original.apply(original, args)
  }
})

// a listener collects a set of all accessed files since it
// was created
function Listener() {
  this.store = {}
  listeners.push(this)
}

// saves a file as visited
Listener.prototype.add = function (file) {
  this.store[file] = true
}

// disables the listener and returns all its collected file reads
Listener.prototype.close = function (file) {
  var self = this
  listeners = listeners.filter(function (listener) {
    return listener !== self
  })

  return Object.keys(this.store)
}

// creates and attaches a new listener
module.exports = function () {
  return new Listener()
}
