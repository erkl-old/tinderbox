var fs = require('fs')
  , path = require('path')
  , mime = require('mime')
  , dispatch = require('./dispatch')

var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server, { log: false })

// broadcast refresh events to all connected clients
dispatch.on('refresh', function (url, rev) {
  io.sockets.emit('refresh', url, rev)
})

io.sockets.on('connection', function (socket) {
  socket.emit('snapshot', dispatch.snapshot())
})

// prepare to serve static files
app.use(require('./middleware/sync'))
app.use(require('./middleware/files'))

app.get('/tinderbox/tinderbox.js', function (req, res, next) {
  res.sendfile(path.join(__dirname, '..', 'client', 'client.js'))
})

app.use(function (req, res, next) {
  var url = req.url.replace(/[\?#].*$/, '')
    , file = resolve(url)
    , type = mime.lookup(file)

  res.on('finish', function () {
    dispatch.define(url, res.files)
  })

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

module.exports = server
