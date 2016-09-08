var setval     = require('setval')
var getval     = require('getval')
var xArray     = require('x-is-array')
var xString    = require('x-is-string')
var xObject    = require('x-is-object')
var xFunction  = require('x-is-function')
var dsplit     = require('dsplit')
var djoin      = require('djoin')
var after      = require('after')
var read       = require('readable-stream')
var contract   = require('./parameter')
var write      = read.Writable
module.exports = sublevelStreams
function sublevelStreams (o) {
  var o = contract(o)
  var prefix = o.prefix
  delete o.prefix
  return _sub(o, prefix)
}
function _sub (o, p, key) {
  p = _fullkey(p, key)
  var subDB = getSubDB(o, p)
  return subDB.db || (subDB.db = { // @TODO: cache vs. `sub-leveldb OR memdb`
    __proto__   : sublevelStreams.prototype,
    fullkey     : function fullkey (key)    {return _fullkey(p, key)},
    sub         : function sub (key)        {return _sub(o, p, key)},
    batch       : function batch (ops,cb)   {return _batch(o, p, ops, cb)},
    put         : function put (key,val,cb) {return _put(o, p, key, val, cb)},
    get         : function get (key,cb)     {return _get(o, p, key, cb)},
    del         : function del (key,cb)     {return _del(o, p, key, cb)},
    duplexable  : function duplexable (key) {return _duplexable(o, p, key)},
    writable    : function writable (key)   {return _writable(o, p, key)},
    readable    : function readable (key)   {return _readable(o, p, key)}
  })
}
function _fullkey (prefix, key) {
  if (key === undefined) key = []
  else if (xString(key)) key = dsplit(key)
  else throw new Error('`key` (if set) should be a string')
  return prefix.concat(key)
}
function getSubDB (o, fullkey) {
  fullkey = djoin(fullkey)
  fullkey = fullkey ? '#' + fullkey : '#'
  return o.subDBs[fullkey] || (o.subDBs[fullkey] = {})
}
function _batch (o, p, ops, cb) {
  if (cb !== undefined) cb = error
  if (!xFunction(cb)) throw new Error('`cb` (if set) must be a function')
  if (xArray(ops)) {
    var next = after(ops.length, cb)
    ops.forEach(function dispatch (op) {
      if (!xObject(op)) op = {}
      if (op.type === 'del') _put(o, p, op.key, op.value, next)
      else if (op.type === 'put') _put(o, p, o.key, o.value, next)
      else next(new Error('`type` must be "del" or "put" and not: '+op.type))
    })
  } else cb(new Error('`ops` must be <array> and not: '+ typeof ops))
}
function error (e) { if (e) throw e }
function _put (o, p, key, val, cb) {
  if (cb !== undefined) cb = error
  if (!xFunction(cb)) throw new Error('`cb` (if set) must be a function')
  key = _fullkey(p, key)
  var old = getval(o.cache, key)
  if (val !== old) {
    setval(o.cache, key, val) // @IDEA maybe deepEqual?
    informListeners(o, key)
  }
  cb(null)
}
function _get (o, p, key, cb) {
  if (xFunction(cb)) cb(null, getval(o.cache, _fullkey(p, key)))
}
function _del (o, p, key, cb) { _put(o, p, key, undefined, cb) }
function _duplexable (o, p, key) {
  throw new Error('... `db.duplexable` is not implemented yet ...')
  // p = _fullkey(p, key)
}
function _writable (o, p, key) {
  p = _fullkey(p, key)
  var subDB = getSubDB(o, p)
  if (!subDB.writer) {
    subDB.writer = write({ objectMode: true })
    subDB.writer._write = function (newval, enc, next) {
      _put(o, p, key, newval, next)
    }
  }
  return subDB.writer
}
function _readable (o, p, key) {
  p = _fullkey(p, key)
  var subDB = getSubDB(o, p)
  if (!subDB.reader) subDB.reader = read({read:function(){},objectMode:true})
  var val = getval(o.cache, key)
  if (val !== undefined) subDB.reader.push(val)
  return subDB.reader
}
function informListeners (o, fullkey) {
  inform(o, fullkey)
  var len = fullkey.length-1
  fullkey.forEach((_, i, parts) => {
    var key = djoin(parts.slice(0,len-i))
    if (key) inform(o,key)
  })
}
function inform (o, key) {
  var reader = getSubDB(o, key).reader
  // @TODO: if no listeners of read stream, maybe remove it?
  // var changekey = fullkey.replace(basekey, '')
  // @TODO: pass changekey? to .push/getval?
  if (reader) {
    var val = getval(o.cache, key)
    console.log('<key>',key)
    console.log('<val>',val)
    // pushing `undefined` doesnt close stram :-) yay!
    setTimeout(function () { reader.push(val) }, 0)
  }
}
