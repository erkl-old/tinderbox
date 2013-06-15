var running = false
  , queue = []

function lock(func) {
  if (running) {
    queue.push(func)
  } else {
    running = true
    func()
  }
}

function unlock() {
  if (queue.length > 0) {
    queue.shift()()
  } else {
    running = false
  }
}

exports.lock = lock
exports.unlock = unlock
