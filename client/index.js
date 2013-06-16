var eio = require('engine.io-client')

var host = window.location.host
  , socket = new eio.Socket('ws://' + host + '/')

socket.on('open', function () {
  socket.on('message', function (msg) {
    // TODO: everything
  })
})
