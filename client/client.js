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
    // TODO: scripts, images and background images
    url = normalize(url)

    if (base === url) {
      window.location.reload()
    }

    refreshStyleSheets(url)
  }

  function refreshStyleSheets(url) {
    for (var i = 0; i < document.styleSheets.length; i++) {
      visitStyleSheet(url, document.styleSheets[i])
    }
  }

  function visitStyleSheet(url, sheet) {
    // TODO: handle imported stylesheets
    if (!sheet.href || normalize(sheet.href) !== url) {
      return
    }

    var node = sheet.ownerNode

    if (node != null && node.tagName === 'LINK') {
      var clone = node.cloneNode(false)
      clone.href = next(sheet.href)
      clone.onload = function () {
        var parent = node.parentNode
        if (parent != null) {
          parent.removeChild(node)
        }
      }

      node.parentNode.insertBefore(clone, node)
    }
  }

  // appends a "random" new querystring parameter to a url
  function next(url) {
    return normalize(url) + '?t=' + (new Date).getTime()
  }

  // expands relative URLs to fully qualified ones
  function normalize(url) {
    url = url.replace(/[\?#].*$/, '')

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
