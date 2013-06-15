var plugins =
    [ require('../plugins/html')
    , require('../plugins/css')
    ]

// determines which plugin would be appropriate for serving
// this file
function search(file, callback) {
  var local = plugins.slice(0)
    , index = 0

  if (local.length === 0) {
    return callback(new Error('no plugins found'))
  }

  function next(err, ok) {
    if (err != null) {
      return callback(err)
    }

    if (ok) {
      return callback(null, local[index])
    }

    if (++index >= local.length) {
      return callback(null, null)
    }

    local[index].test(file, once(next))
  }

  local[index].test(file, once(next))
}

// wraps a function in a closure which prevents it from being
// called more than once
function once(fn, context) {
  var called = false

  return function () {
    if (called) return
    called = true

    var args = Array.prototype.slice.call(arguments)
    return fn.apply(context || null, args)
  }
}

exports.search = search
