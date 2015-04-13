var express = require('express');
var router = express.Router();
var mongojs = require('mongojs')
  /* GET home page. */
  // router.get('/', function(req, res) {
  //   res.render('index', { title: 'Express' });
  // });
router.get('/', function(req, res){
  res.redirect('/static/')
})

router.get('/se', function(req, res) {
  console.info(req.query)
  var request = require('request')
  var qs = require('querystring')
  request.get('http://219.239.89.185:8889/newse?' + qs.stringify(req.query), function(e, r, b) {
    res.send(b)
  })
})

router.get('/sug', function(req, res) {
  console.info(req.query)
  var request = require('request')
  var qs = require('querystring')
  request.get('http://219.239.89.185:8889/newsug?' + qs.stringify(req.query), function(e, r, b) {
    res.send(b)
  })
})

router.get('/info', function(req, res) {
  //require('url').parse('/info?db=xinyou&query=63', true).query
  var query = require('url').parse(req.url, true).query
  var dbname = query.db
  var qid = parseInt(query.query)
  console.log('info', query)
  mongojs(dbname, [dbname])[dbname].findOne({
    _id: qid
  }, function(err, data) {
    console.log('info', err)
    res.set('Content-Type', 'application/json')
    res.send({
      status: 0,
      query: qid,
      data: data
    })
  })
})

module.exports = router