var fs = require('fs')
  , path = require('path')
  , server = require('http').createServer(handler)

var plugins = require('./plugins')
  , mutex = require('./mutex')
  , monitor = require('./monitor')
  , watch = require('./watch')

// http request handler
function handler(req, res) {
  if (req.method.toUpperCase() !== 'GET') {
    return fail(res, 405)
  }

  // disallow potentially evil URLs
  if (req.url.indexOf(path.sep + '..' + path.sep) !== -1) {
    return fail(res, 401)
  }

  var file = resolve(req.url)

  plugins.search(file, function (err, plugin) {
    if (err != null) return fail(res, 500)
    if (plugin == null) return fail(res, 404)

    serve(plugin, req.url, res)
  })
}

// resolves an URL to an absolute filesystem path
function resolve(url) {
  return path.join(process.cwd(), '.' + url)
}

// serves a file through a plugin
function serve(plugin, url, res) {
  // because we need to be able to map all filesystem activity to
  // a single plugin, we can only run one plugin at a time
  mutex.lock(function () {
    var file = resolve(url)
      , mon = monitor()

    plugin.build(file, function (err, type, data) {
      var files = mon.close()
      mutex.unlock()

      if (err != null) {
        return fail(res, 500)
      }

      // update the URL's file dependencies
      watch.register(url, files)

      res.setHeader('Content-Type', type)
      res.end(data)
    })
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
