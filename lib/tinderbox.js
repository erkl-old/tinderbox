// tinderbox middleware generator
module.exports = function (opts) {
  var queue = []

  function lock(fn) { if (queue.push(fn) === 1) fn() }
  function unlock() { if (queue.shift() && queue.length > 0) queue[0]() }

  return function (req, res, next) {
    lock(function () {
      res.on('finish', once(unlock))
      res.on('error', once(unlock))

      next()
    })
  }
}

// makes sure a function can only be called once
function once(fn, ctx) {
  var called = false

  return function () {
    if (!called) {
      called = true
      fn.apply(ctx, Array.prototype.slice.call(arguments))
    }
  }
}
