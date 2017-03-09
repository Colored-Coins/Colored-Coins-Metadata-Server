var async = require('async')
var fs = require('fs')
var casimir = global.casimir
var storage = casimir.storage
var logger = casimir.logger
var EventEmitter = require('events').EventEmitter
EventEmitter.defaultMaxListeners = 0

var Seeder = function (properties) {
  logger.info('Seeder: properties =', properties)
  this.seedBulkSize = parseInt(properties.seedBulkSize, 10)
  this.seedBulkIntervalInMs = parseInt(properties.seedBulkIntervalInMs, 10)
  this.fromTorrentHash = properties.fromTorrentHash
  this.handler = casimir.handler
}

Seeder.prototype.seed = function () {
  var self = this
  // start marker for seeding can be given either from properties (file or environment variable) or last saved (as .txt file)
  var marker = self.fromTorrentHash ? (self.fromTorrentHash + '.ccm') : null
  if (!marker && fs.existsSync('./localdata/marker.txt')) {
    marker = fs.readFileSync('./localdata/marker.txt', 'utf8')
  }
  async.forever(function (next) {
    var done = false // did we iterate over all our storage keys
    var totalIndex = 0
    async.whilst(
      function () { return !done },
      function (callback) {
        storage.listKeys({maxKeys: self.seedBulkSize, marker: marker}, function (err, res) {
          if (err) return callback(err)
          var keys = res.keys
          done = res.done
          fs.writeFileSync('./localdata/marker.txt', keys[0])
          logger.info('Seeding keys ' + totalIndex + ' - ' + (totalIndex + res.keys.length))
          logger.info('marker =', keys[0])
          marker = done ? null : keys[keys.length - 1]
          async.eachOf(keys, function (key, index, cb) {
            var torrentHash
            index += totalIndex
            async.waterfall([
              function (cb) {
                logger.debug('Getting file from S3, file name: ', key, ' - #', index)
                storage.getFile(key, cb)
              },
              function (data, cb) {
                if (!data || !data.Body) {
                  return cb(new Error('get_file_from_s3: no data'))
                }
                logger.debug('Got file from S3, file name: ', key, ' - #', index)
                data = JSON.parse(data.Body.toString())
                self.handler.addMetadata(data, cb)
              },
              function (result, cb) {
                torrentHash = result.torrentHash.toString('hex')
                logger.debug('Added file to BitTorrent network, torrentHash: ', torrentHash, ' - #', index)
                self.handler.shareMetadata(torrentHash, cb)
              },
              function (result, cb) {
                logger.debug('Started seeding, torrentHash: ', torrentHash, ' - #', index)
                setTimeout(cb, self.seedBulkIntervalInMs)
              },
              function (cb) {
                logger.debug('Remove torrent, torrentHash: ', torrentHash, ' - #', index)
                // stop seeding current files (otherwise they'll keep open I\O connections and re-announce)
                self.handler.removeMetadata(torrentHash, cb)
              }
            ],
            function (err) {
              if (err) {
                logger.error('Error while seeding torrentHash: ', err)
                return cb(err)
              }
              logger.debug('Finished for torrentHash: ', torrentHash, ' - #', index)
              cb()
            })
          },
          function (err) {
            totalIndex += self.seedBulkSize
            callback(err)
          })
        })
      },
      function (err) {
        if (err) {
          logger.error('Error received while seeding: ', err)
        } else {
          logger.info('Finished all metadata files Round-robin, starting over.')
        }
        next()
      }
    )
  })
}

module.exports = Seeder
