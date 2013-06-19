var path = require('path')
  , fink = require('fink')

var functions =
    [ 'stat'
    , 'statSync'
    , 'readFile'
    , 'readFileSync'
    , 'createReadStream'
    ]

function collect() {
  var files = []

  function listener(func, args, stack) {
    var file = path.resolve(args[0])
    if (functions.indexOf(func) >= 0 && files.indexOf(file) < 0) {
      files.push(file)
    }
  }

  fink.on('call', listener)
  files.close = fink.removeListener.bind(fink, 'call', listener)

  return files
}

module.exports = collect
