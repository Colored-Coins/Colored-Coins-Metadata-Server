/* eslint-env mocha */
var supertest = require('supertest')
process.env.NODE_ENV = 'QA'
var path = require('path')
var casimir = global.casimir = require(path.join(__dirname, '/../bin/casimir.js'))
var assert = require('assert')
require('../startup')

describe('Metadata server tests', function () {
  this.timeout(50000)

  var api

  before(function (done) {
    var server = casimir.server.http_server
    server.listen(casimir.server.port, function (err) {
      if (err) return done(err)
      api = supertest(server)
      done()
    })
  })

  it('should return 404', function (done) {
    api.post('/')
    .expect(404, done)
  })

  it("should return 'OK' for /isRunning", function (done) {
    api.get('/isRunning')
    .expect(200)
    .end(function (err, res) {
      assert.ifError(err)
      assert.equal(res.text, 'OK')
      done()
    })
  })
})
