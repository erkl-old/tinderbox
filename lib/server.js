var app = require('express')()
  , server = require('http').createServer(app)

app.use(require('./middleware/sync'))
app.use(require('./middleware/files'))

app.use(function (req, res, next) {
  res.type('text/html')
  res.end('TODO')
})

module.exports = server
