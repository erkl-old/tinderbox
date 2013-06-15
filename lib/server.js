var fs = require('fs')
  , path = require('path')
  , server = require('http').createServer(handler)

var plugins = require('./plugins')

// http request handler
function handler(req, res) {
  var url = req.url.replace(/[\?#].*$/, '')
    , cwd = process.cwd()
    , file = path.join(cwd, '.' + url)

  // disallow silly paths
  if (url.indexOf(path.sep + '..' + path.sep) !== -1) {
    return fail(res, 401)
  }

  // determine the appropriate plugin
  plugins.search(file, function (err, plugin) {
    if (err != null) return fail(res, 500)
    if (plugin == null) return fail(res, 404)

    serve(res, plugin, file)
  })
}

// serves a file through a plugin
function serve(res, plugin, file) {
  plugin.build(file, function (err, type, data) {
    if (err != null) return fail(res, 500)

    res.setHeader('Content-Type', type)
    res.end(data)
  })
}

// error messages
var errors =
    { 401: '401 Unauthorized'
    , 404: '404 Not Found'
    , 405: '405 Method Not Allowed'
    , 500: '500 Internal Server Error'
    }

// reports a non-200 status code with an appropriate error message
function fail(res, code) {
  if (!errors[code]) {
    throw new Error('unsupported error code: ' + code)
  }

  if (code === 405) {
    res.setHeader('Allow', 'GET')
  }

  res.statusCode = code
  res.end(errors[code])
}

module.exports = server
