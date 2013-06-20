(function () {
  var protocol = window.location.protocol || 'http:'
    , host = window.location.host
    , base = protocol + '//' + host + window.location.pathname

  function tinderbox(current) {
    var socket = io.connect('ws://' + host + '/')
      , initiated = false

    // handle snapshot updates (this should only happen once; when
    // the connection is established for the first time)
    socket.on('snapshot', function (revs) {
      // if we receive a second snapshot command the server must've
      // reset, which in turns means that all revision numbers
      // are now invalid
      if (initiated) {
        window.location.reload()
      }

      for (var url in revs) {
        check(url, revs[url])
      }

      initiated = true
    })

    // listen for single resource refreshes
    socket.on('refresh', function (url, rev) {
      check(url, rev)
    })

    function check(url, rev) {
      if ((current[url] || 0) < rev) {
        refresh(url)
        current[url] = rev
      }
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
