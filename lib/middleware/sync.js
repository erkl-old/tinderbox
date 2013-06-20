var queue = []

function lock(fn) {
  if (queue.push(fn) === 1) run(fn)
}

function unlock(fn) {
  if (queue[0] === fn) queue.shift()
  if (queue.length > 0) run(queue[0])
}

function run(fn) {
  fn(function () { unlock(fn) })
}

module.exports = function (req, res, next) {
  lock(function (done) {
    res.on('finish', done)
    res.on('error', done)

    next()
  })
}
