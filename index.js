var EventEmitter = require('events').EventEmitter
var next         = process.nextTick
var SubDb        = require('./sub')

var Hooks   = require('level-hooks')

module.exports   = function (db, sep) {
  //use \xff (255) as the seperator,
  //so that sections of the database will sort after the regular keys
  sep = sep || '\xff'

  Hooks(db)

  db.sublevel = function (prefix) {
    return new SubDb(db, prefix, sep)
  }

  db.prefix = function (key) {
    return '' + (key || '')
  }

  db.pre = function (range, hook) {
    if(!hook)
      hook = range, range = {
        start: '',
        end  : sep
      }
    return db.hooks.pre(range, hook)
  }

  db.post = function (range, hook) {
    if(!hook)
      hook = range, range = {
        start: '',
        end  : sep
      }
    return db.hooks.post(range, hook)
  }

  var createReadStream = db.createReadStream

  db.createReadStream = function (opts) {
    opts = opts || {}
    if(!opts.end && !opts.start)
      opts.end = sep
    return createReadStream.call(db, opts)
  }

  var batch = db.batch
  db.batch = function (changes, opts, cb) {
    changes.forEach(function (e) {
      if(e.prefix) {
        if(e.prefix && 'function' === typeof e.prefix.prefix)
          e.key = e.prefix.prefix(e.key)
      }
    })
    batch.call(db, changes, opts, cb)
  }
  return db
}

