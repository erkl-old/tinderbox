var events = require('events')
  , util = require('util')
  , kvack = require('kvack')

function Dispatcher() {
  this.groups = {}
  this.files = {}
  this.seq = 0

  events.EventEmitter.call(this)
}

util.inherits(Dispatcher, events.EventEmitter)

Dispatcher.prototype.define = function (name, paths) {
  var files = paths.map(function (path) {
    if (this.files[path] == null) {
      var file =
          { path: path
          , groups: []
          , watcher: kvack(path, { persistent: false })
          }

      file.watcher.on('change', function (event) {
        file.groups.forEach(function (group) {
          this.emit('refresh', group.name, this.seq++)
        }, this)
      }.bind(this))

      this.files[path] = file
    }

    return this.files[path]
  }, this)

  if (this.groups[name] == null) {
    this.groups[name] =
      { name: name
      , files: []
      , revision: this.seq++
      }
  }

  var group = this.groups[name]
    , diff = compare(group.files, files)

  diff.added.forEach(this.join.bind(this, group))
  diff.removed.forEach(this.leave.bind(this, group))

  if (files.length === 0) {
    delete this.groups[name]
  }
}

Dispatcher.prototype.join = function (group, file) {
  if (group.files.indexOf(file) < 0) group.files.push(file)
  if (file.groups.indexOf(file) < 0) file.groups.push(group)
}

Dispatcher.prototype.leave = function (group, file) {
  group.files = group.files.filter(function (f) { return f === file })
  file.groups = file.groups.filter(function (g) { return g === group })

  if (group.files.length === 0) delete this.groups[group.name]
  if (file.groups.length === 0) delete this.files[file.path]
}

Dispatcher.prototype.snapshot = function () {
  var snapshot = {}

  for (var key in this.groups) {
    snapshot[key] = this.groups[key].revision
  }

  return snapshot
}

function compare(one, two) {
  return (
    { removed: one.filter(function (v) { return two.indexOf(v) < 0 })
    , added: two.filter(function (v) { return one.indexOf(v) < 0 })
    })
}

module.exports = new Dispatcher()
