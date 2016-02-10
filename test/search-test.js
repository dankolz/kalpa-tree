var test = require('tape').test
  , d3 = require('d3')
  , Tree = require('../')
  , stream = require('./tree-stream')
  , Transform = require('stream').Transform

test('search call is noop if not displaying search results', function (t) {
  var s = stream()
    , tree = new Tree({stream: s}).render()

  s.on('end', function () {
    tree.select(1058)
    t.equal(tree.node.size(), 8, '8 initial nodes')
    tree.search()
    t.equal(tree.node.size(), 8, '8 nodes displayed after search for null')
    tree.search()
    t.equal(tree.node.size(), 8, '8 nodes displayed because it should not toggle')
    tree.remove()
    t.end()
  })
})

test('search', function (t) {
  var s = stream()
    , tree = new Tree({stream: s}).render()

  s.on('end', function () {
    t.equal(tree.node.size(), 3, '3 initial nodes')
    tree.search('M')
    t.equal(tree.node.size(), 25, '25 nodes visible')
    t.ok(tree.el.select('.tree').classed('search-results'), 'tree has search-results class')
    t.ok(tree._searchResults, 'tree stored _searchResults data')
    t.equal(tree.nodes[d3.select(tree.node[0][0]).datum().id].label, 'M1', 'M1 is the first result')
    tree.select(d3.select(tree.node[0][3]).datum().id)
    t.equal(tree.node.size(), 18, '18 nodes visible')
    t.ok(!tree.el.select('.tree').classed('search-results'), 'tree does not have search-results class')
    t.ok(!tree._searchResults, 'tree no longer has _searchResults data')
    tree.remove()
    t.end()
  })
})

test('search allows different characters', function (t) {
  var s = stream()
    , tree = new Tree({stream: s}).render()

  s.on('end', function () {
    tree.search('as\\')
    t.equal(tree.node.size(), 0, '0 nodes visible')
    t.end()
  })
})

test('search ignores `visible: false` nodes', function (t) {
  var map = new Transform( { objectMode: true } )
    , hiddens = [1002, 1003, 1081]

  map._transform = function(obj, encoding, done) {
    if (hiddens.indexOf(obj.id) !== -1) {
      obj.visible = false
    }
    this.push(obj)
    done()
  }

  var s = stream().pipe(map)
    , tree = new Tree({stream: s}).render()

  s.on('end', function () {
    t.equal(tree.node.size(), 2, '2 initial nodes')
    tree.search('O1')
    t.equal(tree.node.size(), 0, '0 nodes visible')
    tree.remove()
    t.end()
  })
})

test('search for null clears search', function (t) {
  var s = stream()
    , tree = new Tree({stream: s}).render()

  s.on('end', function () {
    t.equal(tree.node.size(), 3, '3 initial nodes')
    tree.search('M')
    t.equal(tree.node.size(), 25, '25 nodes visible')
    tree.search(null)
    t.ok(!tree.el.select('.tree').classed('search-results'), 'tree does not have search-results class')
    t.equal(tree.node.size(), 3, '3 nodes visible')
    tree.remove()
    t.end()
  })
})

test('shows seleceted search result in a collapsed tree', function (t) {
  var s = stream()
    , tree = new Tree({ stream: s }).render()

  document.body.appendChild(tree.el.node()) // Add to the dom so the click handlers work

  s.on('end', function () {
    tree.expandAll()
    tree.search('M')
    t.equal(tree.node.size(), 25, '25 nodes visible')
    t.ok(tree.el.select('.tree').classed('search-results'), 'tree showing search-results')
    tree.node[0][3].click() // Click on M4
    t.equal(tree.node.size(), 18, '18 nodes visible') // Not all nodes from previous expandAll
    t.ok(!tree.el.select('.tree').classed('search-results'), 'tree not showing search-results')
    tree.remove()
    t.end()
  })
})

test('ignores rootHeight overrides while showing results', function (t) {
  var s = stream()
    , tree = new Tree({
      stream: s,
      rootHeight: 50
    }).render()

  s.on('end', function () {
    t.ok(tree.el.select('.tree').classed('detached-root'), 'detached root')
    t.equal(tree.el.select('.tree ul li:nth-child(2)').datum()._y, 50, 'second node is at 50')
    tree.search('M')
    t.ok(!tree.el.select('.tree').classed('detached-root'), 'tree not showing a detached root')
    t.equal(tree.el.select('.tree ul li:nth-child(2)').datum()._y, 36, 'second node is at 36 (regular height)')
    tree.search(null)

    setTimeout(function () {
      t.ok(tree.el.select('.tree').classed('detached-root'), 'tree back to detached root')
      t.equal(tree.el.select('.tree ul li:nth-child(2)').datum()._y, 50, 'second node back at 50')
      tree.remove()
      t.end()
    }, 400)
  })
})
