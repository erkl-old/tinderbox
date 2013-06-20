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

module.exports = function (req, res, next) {
  lock(function (done) {
    res.on('finish', done)
    res.on('error', done)

    next()
  })
}
