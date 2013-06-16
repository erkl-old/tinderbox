var fs = require('fs')
  , path = require('path')

var eioc = require.resolve('engine.io-client')
  , payload = ''
  , scripts =
    { '/_/engine.io.js': path.join(eioc, '../engine.io.js')
    , '/_/frog.js': path.join(__dirname, '../client/frog.js')
    }

// load all client-side scripts and generate the HTML payload
for (var url in scripts) {
  payload += '<script type="text/javascript" src="' + url + '"></script>\n'
  scripts[url] = fs.readFileSync(scripts[url], 'utf8')
}

exports.payload = payload
exports.scripts = scripts
