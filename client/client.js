(function () {
  var protocol = window.location.protocol || 'http:'
    , host = window.location.host
    , base = protocol + '//' + host + window.location.pathname
    , seq = 0

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
      if (rev < seq) {
        // TODO: the server must've restarted (because revision ids
        //       are being reused) -- force a full reload
      }

      if ((state[url] || -1) < rev) {
        refresh(url)
        state[url] = rev
      }

      seq++
    }
  }

  function refresh(url) {
    // TODO: pretty much everything
  }

  // expands relative URLs to fully qualified ones
  function expand(url) {
    if (/[a-z]+:\/\//i.test(url)) {
      return url
    }

    if (url.charAt(0) === '/') {
      return protocol + '//' + host + url
    }

    var slash = base.lastIndexOf('/')
    return base.substring(0, slash+1) + url
  }

  window.tinderbox = tinderbox
})();
