var dispatch = require('./dispatch')
  , collect = require('./collect')

// to be able to distinguish which request lead to what file system activity,
// all incoming requests are pushed to a queue and processed one at a time
var queue = []

function lock(func) {
  if (queue.push(func) === 1) {
    func(function () { unlock(func) })
  }
}

function unlock(func) {
  if (queue[0] === func) queue.shift()
  if (queue.length > 0) queue[0]()
}

module.exports = function (opts) {
  return function (req, res, next) {
    lock(function (done) {
      res.on('finish', done)
      res.on('error', done)

      tinderbox(req, res, next)
    })
  }
}

// the core tinderbox request handler
function tinderbox(req, res, next) {
  var files = collect()
    , end = res.end

  res.on('error', files.close.bind(files))
  res.on('finish', function () {
    // TODO: use `req.url` and `files`
  })

  // replace the default `end` method with a custom wrapper,
  // so we can append client-side JavaScript to HTML pages
  res.end = function () {
    var args = Array.prototype.slice.call(arguments)
    if (args.length > 0) {
      res.write.apply(res, args)
    }

    var type = res.getHeader('Content-Type')
    if (/^text\/html($|;)/.test(type)) {
      res.write('\n\n<!-- client-side code goes here -->\n')
    }

    end.call(res)
  }

  next()
}
