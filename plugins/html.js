var fs = require('fs')
  , path = require('path')

exports.test = function (file, callback) {
  file = expand(file)

  if (path.extname(file) !== '.html') {
    return callback(null, false)
  }

  fs.stat(file, function (err, stats) {
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
