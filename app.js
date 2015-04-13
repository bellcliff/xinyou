var express = require('express')
var path = require('path')
var nconf = require('nconf')
var bodyParser = require('body-parser')
var routes = require('./routes/index')

var app = express()

// load config, can be replace with redis
nconf.file({
  file: 'conf.json'
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

// uncomment after placing your favicon in /public
app.use('/static', express.static(path.join(__dirname, 'public')))
app.use('/', routes)

// catch 404 and forward to error handler
app.use(function(err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.listen(nconf.get('http:port'))

module.exports = app