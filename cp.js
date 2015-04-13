// check local max id
// cp 100 every time
var mongojs = require('mongojs')
var Q = require('q')
var _ = require('underscore')
var dbname = 'wenda'
var batchnumber = 70000

var http = require('http')
var pool = new http.Agent()

http.globalAgent.maxSockets = 20
console.log('maxSockets', http.globalAgent)

var getMongoDB = function() {
  return mongojs(dbname, [dbname])[dbname]
}

var getLocalMaxId = function() {
  var deferred = Q.defer()
  var ctx = arguments && arguments[0] || {}
  console.log('getLocalCount', ctx)
  getMongoDB().findOne({
    $query: {},
    $orderby: {
      id: -1
    }
  }, function(err, data) {
    if (err) {
      console.log('getLocalCount', err)
      deferred.reject(-1)
    } else {
      console.log('getLocalMaxId', data)
      maxid = data && data._id || 0
      ctx.l = maxid
      console.log('getLocalCount', ctx)
      deferred.resolve(ctx)
    }
  })
  return deferred.promise
}

var getLocalCount = function() {
  var deferred = Q.defer()
  console.log('getLocalCount')
  getMongoDB().runCommand('count', function(err, res) {
    console.log('getLocalCount', err ? err : res)
    deferred.resolve({})
  })
  return deferred.promise
}

var getRemoteMaxId = function() {
  var deferred = Q.defer(),
    ctx = arguments && arguments[0] || {}
  console.log('remote max id', ctx)
  http.get('http://219.239.89.185:8889/newmaxid?db=' + dbname, function(res) {
    var body = ''
    res.on('data', function(data) {
      body += data
    })
    res.on('end', function() {
      ctx.r = JSON.parse(body).maxid
      console.log('getRemoteMaxId', ctx)
      deferred.resolve(ctx)
    })
  }).on('error', function(e) {
    deferred.resolve(-1)
  })
  return deferred.promise
}

var readInfo = function(infoid) {
  var deferred = Q.defer()
  console.log('readInfo', infoid)
  var req = http.get('http://219.239.89.185:8889/newinfo?db=' + dbname + '&query=' + infoid, function(res) {
    var body = ''
    res.on('data', function(data) {
      body += data
    })
    res.on('end', function() {
      try {
        jsonInfo = JSON.parse(body)
        if (jsonInfo && jsonInfo.data && jsonInfo.data.id && jsonInfo.status == 0) {
          jsonInfo.data._id = jsonInfo.data.id
          deferred.resolve(jsonInfo.data)
        } else {
          console.log('readInfo', body)
          deferred.reject(infoid)
        }
      } catch (e) {
        console.log('readInfo', e)
        deferred.reject(infoid)
      }
    })
  }).on('error', function(e) {
    console.log('readInfo', e)
    deferred.reject(infoid)
  });

  return deferred.promise
}

var readBatchInfo = function(ctx) {
  var deferred = Q.defer(),
    ids = ctx.errs || ctx.ids,
    oks = [],
    errs = []
  console.log('readBatchInfo', ids.length)
  _.each(ids, function(id) {
    readInfo(id).then(function(jsonInfo) {
      console.log('readBatchInfo', id)
      oks.push(jsonInfo)
    }).catch(function(errid) {
      console.log('readBatchInfo fail', errid)
      errs.push(errid)
    }).then(function() {
      if (oks.length + errs.length == ids.length) {
        console.log('readBatchInfo fail count', errs.length)
          // update errs and retry
        ctx.errs = errs
        ctx.oks = _.union(oks, ctx.oks || [])
        ctx.retry = (ctx.retry || 0) + 1
        if (errs.length > 0 && ctx.retry < 10) {
          console.log('readBatchInfo retry', ctx.retry)
          setTimeout(function() {
            readBatchInfo(ctx).then(function(ctx) {
              // one retry
              deferred.resolve(ctx)
            })
          }, 500)
        } else
          deferred.resolve(ctx)
      }
    })
  })
  return deferred.promise
}

var saveMongo = function(ctx) {
  var deferred = Q.defer()
  if (ctx && ctx.oks) {
    console.log('saveMongo', ctx.oks.length)

    getMongoDB().insert(ctx.oks, {
      continueOnError: true
    }, function(err, data) {
      err && console.error('saveMongo fail', err)
      deferred.resolve(ctx)
    })
  } else {
    deferred.resolve(ctx)
  }
  return deferred.promise
}

var getReadList = function(ctx) {
  console.log('getReadList', ctx)
  ctx.ids = []
  ctx.l = ctx.l || 0
  if (ctx.r && ctx.l < ctx.r) {
    ctx.ids = _.range(ctx.l + 1, _.min([ctx.l + 1 + batchnumber, ctx.r]) + 1)
  } else {
    console.log('getReadList', 'stop')
    process.exit(0)
  }
  console.log('getReadList', ctx.ids.length)
  return ctx
}

// cpMore().then(process.exit)
getLocalMaxId().then(getRemoteMaxId).then(getReadList).then(readBatchInfo).then(saveMongo).then(process.exit)



// Q.all([getLocalMaxId(), getRemoteMaxId()]).spread(function(l, r) {
//   console.log(l, r)
//   if (r > l) {
//     return {
//       ids: _.range(l + 1, l + _.min([100, r - l]))
//     }
//   } else
//     throw 'no need'
// }).then(readBatchInfo).delay(100).then(readBatchInfo).then(saveMongo).done(process.exit)