var fs = require('fs')
  , path = require('path')

var monitors = []
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
    monitors.forEach(function (monitor) {
      monitor.add(path.resolve(process.cwd(), file))
    })

    var args = Array.prototype.slice.call(arguments)
    return original.apply(original, args)
  }
})

// a monitor collects a set of all accessed files since it
// was created
function Monitor() {
  this.store = {}
  monitors.push(this)
}

// saves a file as visited
Monitor.prototype.add = function (file) {
  this.store[file] = true
}

// disables the monitor and returns all its collected file reads
Monitor.prototype.close = function (file) {
  var self = this
  monitors = monitors.filter(function (monitor) {
    return monitor !== self
  })

  return Object.keys(this.store)
}

// creates and attaches a new monitor
module.exports = function () {
  return new Monitor()
}
