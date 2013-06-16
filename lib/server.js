var fs = require('fs')
  , path = require('path')
  , server = require('http').createServer(handler)

var plugins = require('./plugins')
  , monitor = require('./monitor')
  , watch = require('./watch')
  , client = require('./client')
  , util = require('./util')

// http request handler
function handler(req, res) {
  if (req.method.toUpperCase() !== 'GET') {
    return fail(res, 405)
  }

  // disallow potentially evil URLs
  if (req.url.indexOf(path.sep + '..' + path.sep) !== -1) {
    return fail(res, 401)
  }

  // serve requests for client-side scripts
  var script = client.scripts[req.url]

  if (script != null) {
    res.setHeader('Content-Type', 'text/javascript')
    res.end(script)
    return
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
  util.lock(function (done) {
    var file = resolve(url)
      , mon = monitor()

    plugin.build(file, function (err, type, data) {
      var files = mon.close()

      done()

      if (err != null) {
        return fail(res, 500)
      }

      // update the URL's file dependencies
      watch.register(url, files)

      // attach the custom payload to HTML pages
      if (type === 'text/html') {
        data += '\n' + client.payload
      }

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
