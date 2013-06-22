(function () {
  var protocol = window.location.protocol || 'http:'
    , host = window.location.host
    , base = protocol + '//' + host + window.location.pathname

  function tinderbox(current) {
    var socket = io.connect('ws://' + host + '/')
      , initiated = false

    socket.on('snapshot', function (revs) {
      // if we receive a second snapshot command the server must've
      // reset, which in turns means that all revision numbers
      // are now invalid
      if (initiated) {
        window.location.reload()
      } else {
        initiated = true
      }

      for (var url in revs) {
        check(url, revs[url])
      }
    })

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

  // triggers a refresh of all elements or resources referencing
  // the URL
  function refresh(url) {
    url = normalize(url)

    // reload the whole document if the HTML page itself has changed
    if (base === url) {
      return window.location.reload()
    }

    // reload referenced all style sheets
    for (var i = 0; i < document.styleSheets.length; i++) {
      var styleSheet = document.styleSheets[i]
        , node = styleSheet.ownerNode
        , tag = (node || {}).tagName

      if (tag === 'LINK' && checkStyleSheet(url, styleSheet)) {
        var clone = replace(node)
        clone.href = next(node.href)
      }
    }

    // TODO: scripts, images
  }

  // returns true if the style sheet references the URL in question, or if
  // any of its imports does
  function checkStyleSheet(url, styleSheet) {
    if (styleSheet.href && normalize(styleSheet.href) === url) {
      return true
    }

    for (var i = 0; i < styleSheet.cssRules.length; i++) {
      var child = styleSheet.cssRules[i].styleSheet
      if (child != null && checkStyleSheet(url, child)) {
        return true
      }
    }
  }

  // replaces a DOM element with an identical copy
  function replace(node) {
    var clone = node.cloneNode(false)

    clone.onload = function () {
      if (node.parentNode != null) {
        node.parentNode.removeChild(node)
      }
    }

    node.parentNode.insertBefore(clone, node)

    return clone
  }

  // generates a new URL, known not to be cached by the browser, by
  // appending a timestamp to a base URL
  function next(url) {
    return normalize(url) + '?t=' + (new Date).getTime()
  }

  // resolves relative URLs to fully qualified ones
  function normalize(url) {
    url = url.replace(/[\?#].*$/, '')

    if (/[a-z]+:\/\//i.test(url)) return url
    if (url.charAt(0) === '/') return protocol + '//' + host + url
    return base.substring(0, base.lastIndexOf('/')+1) + url
  }

  window.tinderbox = tinderbox
})();
