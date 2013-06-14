var events = require('events')
  , fs = require('fs')

var handle = new events.EventEmitter()
  , funcs =
    [ 'open'
    , 'openSync'
    , 'readFile'
    , 'readFileSync'
    , 'stat'
    , 'statSync'
    ]

funcs.forEach(function (name, i) {
  var original = fs[name]

  fs[name] = function (file) {
    handle.emit('access', path.resolve(process.cwd(), file))

    var args = Array.prototype.slice.call(arguments)
    return original.apply(original, args)
  }
})

module.exports = handle
