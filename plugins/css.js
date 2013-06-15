var fs = require('fs')
  , path = require('path')

exports.test = function (file, callback) {
  if (path.extname(file) !== '.css') {
    return callback(null, false)
  }

  fs.stat(file, function (err, stats) {
    callback(null, err == null)
  })
}

exports.build = function (file, callback) {
  fs.readFile(file, function (err, body) {
    if (err != null) {
      return callback(err)
    }

    callback(null, 'text/css', body)
  })
}
