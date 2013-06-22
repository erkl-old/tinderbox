var path = require('path')
  , fink = require('fink')
  , dispatch = require('../dispatch')

var functions =
    [ 'stat'
    , 'statSync'
    , 'readFile'
    , 'readFileSync'
    , 'createReadStream'
    ]

var buckets = []
  , pauses = 0

// register touched files
fink.on('call', function (func, args, stack) {
  if (pauses !== 0) return
  if (functions.indexOf(func) === -1) return

  buckets.forEach(function (bucket) {
    if (bucket.indexOf(args[0]) === -1) {
      bucket.push(path.resolve(args[0]))
    }
  })
})

// log all files used while serving a particular request
module.exports = function (req, res, next) {
  var url = req.url.replace(/[\?#].*$/, '')
    , files = []

  buckets.push(files)

  function remove() {
    buckets = buckets.filter(function (v) { return v !== files })
  }

  res.on('error', remove)
  res.on('finish', function () {
    dispatch.define(url, files)
    remove()
  })

  next()
}

module.exports.pause = function () { pauses++ }
module.exports.resume = function () { pauses = Math.max(0, pauses-1) }
