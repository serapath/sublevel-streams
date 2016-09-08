var xDTypeArray= require('x-is-ducktype-array')
var xEmptyObj  = require('x-is-empty-object')
var xString    = require('x-is-string')
var xObject    = require('x-is-object')
var dsplit     = require('dsplit')
var setval     = require('setval')
var getval     = require('getval')
module.exports = validateAndSanitize
function validateAndSanitize (o) {
  /********** validate & sanitize `o` **********/
  if (o === undefined) o = { cache: {}, subDBs: {}, prefix: [] }
  else if (!xObject(o))
    throw new Error('if `o` argument is given, it must be an options object')
  else {
    /********** validate & sanitize `subDBs` **********/
    if (o.subDBs === undefined) o.subDBs = {}
    if (!xEmptyObj(o.subDBs))
      throw new Error('`o.subDBs` (if set) should be `{}`')
    /********** validate & sanitize `prefix` **********/
    if (xString(o.prefix)) o.prefix = dsplit(o.prefix)
    else if (o.prefix === undefined) o.prefix = []
    else throw new Error('`o.prefix` (if set) should be a string')
    /********** validate & sanitize `cache` **********/
    if (o.cache  === undefined) (o.cache  = {}, o.prefix = [])
    if (!xObject(o.cache))
      throw new Error('`o.cache` (if set) should be an object')
    /********** validate & sanitize `cache` at `prefix` **********/
    var cache = getval(o.cache, o.prefix)
    if (cache === undefined) {
      cache = {}
      setval(o.cache, o.prefix, cache)
      o.cache = cache
    } else (o.cache = cache, o.prefix = [])
    if (!xEmptyObj(o.cache))
      throw new Error('`cache` (if set) should be `{}||undefined` at `prefix`')
  }
  return o
}
