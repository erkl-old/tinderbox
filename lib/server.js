var fs = require('fs')
  , http = require('http')
  , path = require('path')
  , mime = require('mime')
  , express = require('express')
  , dispatch = require('./dispatch')

var app = express()
  , server = http.createServer(app)

app.use(require('./middleware/sync'))
app.use(require('./middleware/files'))

app.get('/tinderbox/tinderbox.js', function (req, res, next) {
  res.type('text/javascript')
  res.end('// TODO')
})

app.use(function (req, res, next) {
  var url = req.url.replace(/[\?#].*$/, '')
    , file = resolve(req.url)
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

    res.type(type).end(body)
  })
})

function resolve(url) {
  if (url.charAt(url.length-1) === '/') url += 'index.html'
  return path.resolve(process.cwd(), url.substring(1))
}

function affix(snapshot) {
  return (
    [ '<!-- inserted by tinderbox: -->'
    , '<script type="text/javascript" src="/socket.io/socket.io.js"></script>'
    , '<script type="text/javascript" src="/tinderbox/tinderbox.js"></script>'
    , '<script type="text/javascript">tinderbox(' + JSON.stringify(snapshot) + ')</script>'
    ].join('\n'))
}

module.exports = server
