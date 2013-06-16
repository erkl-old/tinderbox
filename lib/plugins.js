var util = require('./util')

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

    local[index].test(file, util.once(next))
  }

  local[index].test(file, util.once(next))
}

exports.search = search
