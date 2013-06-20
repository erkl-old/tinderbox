var path = require('path')
  , fink = require('fink')

var buckets = []
  , pauses = 0
  , functions =
    [ 'stat'
    , 'statSync'
    , 'readFile'
    , 'readFileSync'
    , 'createReadStream'
    ]

fink.on('call', function (func, file, args, stack) {
  if (pauses !== 0) return
  if (functions.indexOf(func) === -1) return

  buckets.forEach(function (bucket) {
    if (bucket.indexOf(file) === -1) {
      bucket.push(path.resolve(file))
    }
  })
})

module.exports = function (req, res, next) {
  var files = res.files = []
  buckets.push(files)

  function remove() {
    buckets = buckets.filter(function (v) { return v !== files })
  }

  res.on('error', remove)
  res.on('finish', remove)

  next()
}

module.exports.pause = function () { pauses++ }
module.exports.resume = function () { pauses = Math.max(0, pauses-1) }
