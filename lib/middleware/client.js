var path = require('path')

// provide client-side resources
module.exports = function (req, res, next) {
  var url = req.url.replace(/[\?#].*$/, '')
    , file = path.join(__dirname, '..', '..', 'client', 'client.js')

  if (url === '/tinderbox/tinderbox.js') {
    res.sendfile(file)
  } else {
    next()
  }
}
