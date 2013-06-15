var fs = require('fs')
  , path = require('path')

exports.test = function (file, callback) {
  fs.stat(expand(file), function (err, stats) {
    callback(null, err == null)
  })
}

exports.build = function (file, callback) {
  fs.readFile(expand(file), function (err, body) {
    if (err != null) {
      return callback(err)
    }

    callback(null, 'text/html', body)
  })
}

function expand(file) {
  if (file.charAt(file.length - 1) === '/') file += 'index'
  if (path.extname(file) === '') file += '.html'
  return file
}
