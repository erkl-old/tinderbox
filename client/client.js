(function () {
  var host = window.location.host

  function tinderbox(state) {
    var socket = io.connect('ws://' + host + '/')

    // handle snapshot updates (this should only happen once; when
    // the connection is established for the first time)
    socket.on('snapshot', function (revisions) {
      for (var url in revisions) {
        trigger(url, revisions[url])
      }
    })

    // listen for single resource refreshes
    socket.on('refresh', function (url, rev) {
      trigger(url, rev)
    })

    function trigger(url, rev) {
      if ((state[url] || -1) < rev) {
        refresh(url)
        state[url] = rev
      }
    }
  }

  function refresh(url) {
    // TODO: pretty much everything
  }

  window.tinderbox = tinderbox
})();
