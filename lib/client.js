var fs = require('fs')
  , path = require('path')
  , wheelbarrow = require('wheelbarrow')

var eioBase = require.resolve('engine.io-client')
  , eioPath = path.join(eioBase, '../engine.io.js')
  , eioSrc = fs.readFileSync(eioPath, 'utf8')

// resolve `require('engine.io-client')` to an already compiled version
// of the engine.io client library
function load(origin, name, callback) {
  if (name === 'engine.io-client') {
    return callback(null, { path: eioPath, src: eioSrc })
  }
  return wheelbarrow.load(origin, name, callback)
}

// because engine.io-client uses its own system for requires, so we
// have to disable default scanning
function scan(file) {
  if (file.path === eioPath) return []
  return wheelbarrow.scan(file)
}

// load the main client file and build the entire client-side payload
var main = path.join(__dirname, '../client/index.js')
  , src = fs.readFileSync(main, 'utf8')
  , input = [{ path: main, src: src }]

wheelbarrow(input, { load: load, scan: scan }, function (err, js) {
  if (err != null) {
    throw err
  }
  exports.js = js
})
