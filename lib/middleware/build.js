var fs = require('fs')
  , path = require('path')
  , mime = require('mime')
  , dispatch = require('../dispatch')

// generate and serve static files
module.exports = function (req, res, next) {
  var url = req.url.replace(/[\?#].*$/, '')
    , file = resolve(url)
    , type = mime.lookup(file)

  fs.readFile(file, 'utf8', function (err, body) {
    if (err != null) {
      type = 'text/plain'

      if (err.code !== 'ENOENT') {
        res.status(500)
        body = err.message
      } else {
        res.status(404)
        body = '404'
      }
    }

    if (type === 'text/html') {
      body += '\n' + affix(dispatch.snapshot()) + '\n'
    }

    if (type.substring(0, 5) === 'text/') {
      type += '; charset=utf-8'
    }

    res.type(type).end(body)
  })
}

// resolves a request url to a file path
function resolve(url) {
  if (url.charAt(url.length-1) === '/') url += 'index.html'
  return path.resolve(process.cwd(), url.substring(1))
}

// generates a HTML affix given a particular snapshot
function affix(snapshot) {
  return (
    [ '<!-- inserted by tinderbox: -->'
    , '<script type="text/javascript" src="/socket.io/socket.io.js"></script>'
    , '<script type="text/javascript" src="/tinderbox/tinderbox.js"></script>'
    , '<script type="text/javascript">tinderbox(' + JSON.stringify(snapshot) + ')</script>'
    ].join('\n'))
}
