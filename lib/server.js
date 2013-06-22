var fs = require('fs')
  , path = require('path')
  , http = require('http')
  , express = require('express')
  , dispatch = require('./dispatch')

var app = express()
  , server = http.createServer()
  , io = require('socket.io').listen(server, { log: false })

// first of all, make sure we only serve a single request at a time
app.use(require('./middleware/sync'))

// watch all filesystem activity while serving request
app.use(require('./middleware/monitor'))

// remove socket.io's own request listener, then add custom
// middleware to forward select requests to it
server._events.request = [app]

app.use(function (req, res, next) {
  if (io.checkRequest(req)) {
    io.handleRequest(req, res)
  } else {
    next()
  }
})

// serve client-side resources
app.use(require('./middleware/client'))

// serve static assets from disk
app.use(require('./middleware/build'))

// broadcast refresh events to connected clients
dispatch.on('refresh', function (url, rev) {
  io.sockets.emit('refresh', url, rev)
})

io.sockets.on('connection', function (socket) {
  socket.emit('snapshot', dispatch.snapshot())
})

module.exports = server
