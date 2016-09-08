var test = require('tape')

var sublevelStreams = require('./')

test('sublevelStreams initialization', function (t) {
  t.plan(7)
  var o = { cache: {}, subDBs: {}, prefix: '' }
  t.ok(sublevelStreams(o))
  var o = { cache: { a: {} }, subDBs: {}, prefix: 'a' }
  t.ok(sublevelStreams(o))
  var o = { cache: { a: { b: {} } }, subDBs: {}, prefix: 'a' }
  var err = '`cache` (if set) should be `{}||undefined` at `prefix`'
  t.throws(function(){sublevelStreams(o)},err)
  var o = { cache: { a: 'foobar' }, subDBs: {}, prefix: 'a' }
  t.throws(function(){sublevelStreams(o)},err)
  var o = { subDBs: {}, prefix: 'a/b' }
  t.ok(sublevelStreams(o))

  var db = sublevelStreams()
  t.ok(db, 'create default sublevelStreams()')
  t.ok(db instanceof sublevelStreams, 'db instanceof sublevelStreams')

})

test('make sublevelStreams', function (t) {
  t.plan(17)

  var o = { cache: {}, subDBs: {} }
  var db = sublevelStreams(o)

  var expect = ['#']
  t.equal(o.subDBs['#'].db, db)
  t.deepEqual(Object.keys(o.subDBs),expect, expect)

  var subDB = db.sub('foo')
  var expect = ['#','#foo']
  t.equal(o.subDBs['#foo'].db, subDB)
  t.deepEqual(Object.keys(o.subDBs),expect, expect)

  var subDB = db.sub('bar')
  var expect = ['#','#foo','#bar']
  t.equal(o.subDBs['#bar'].db, subDB)
  t.deepEqual(Object.keys(o.subDBs),expect, expect)

  var x = db.writable('y')
  var expect = ['#','#foo','#bar','#y']
  t.equal(o.subDBs['#y'].writer, x)
  t.deepEqual(Object.keys(o.subDBs),expect, expect)

  var subDB = subDB.sub('baz')
  var expect = ['#','#foo','#bar','#y','#bar/baz']
  t.deepEqual(Object.keys(o.subDBs),expect, expect)

  var a = subDB.readable('a')
  var expect = ['#','#foo','#bar','#y','#bar/baz', '#bar/baz/a']
  t.equal(o.subDBs['#bar/baz/a'].reader, a)
  t.deepEqual(Object.keys(o.subDBs),expect, expect)

  var b = subDB.readable('a/b')
  var expect = ['#','#foo','#bar','#y','#bar/baz','#bar/baz/a','#bar/baz/a/b']
  t.equal(o.subDBs['#bar/baz/a/b'].reader, b)
  t.deepEqual(Object.keys(o.subDBs),expect, expect)

  var c = subDB.writable('a/c')
  var expect = ['#','#foo','#bar','#y',
  '#bar/baz','#bar/baz/a','#bar/baz/a/b','#bar/baz/a/c']
  t.equal(o.subDBs['#bar/baz/a/c'].writer, c)
  t.deepEqual(Object.keys(o.subDBs),expect, expect)

  var d = subDB.readable('/d')
  var expect = ['#','#foo','#bar','#y','#bar/baz',
  '#bar/baz/a','#bar/baz/a/b','#bar/baz/a/c', '#bar/baz//d']
  t.equal(o.subDBs['#bar/baz//d'].reader, d)
  t.deepEqual(Object.keys(o.subDBs),expect, expect)

})

test('sublevelStreams updates', function (t) {
  t.plan(7)

  var o = { cache: {}, subDBs: {} }
  var db = sublevelStreams(o)
  var r0 = db.readable('title')
  var subDB1 = db.sub('input')
  var w1 = subDB1.writable()
  var subDB2 = db.sub('todos')
  var r2 = subDB2.readable()

  var expect = ['#','#title','#input','#todos']
  t.deepEqual(Object.keys(o.subDBs),expect, expect)
  t.equal(o.subDBs['#'].db, db, 'db')
  t.equal(o.subDBs['#title'].reader, r0, 'reader title')
  t.equal(o.subDBs['#input'].db, subDB1, 'input db')
  t.equal(o.subDBs['#input'].writer, w1, 'writer input')
  t.equal(o.subDBs['#todos'].db, subDB2, 'todos db')
  t.equal(o.subDBs['#todos'].reader, r2, 'todos reader')


  console.log(o.cache)
  w1.write('m3h')

})
