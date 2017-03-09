var AWS = require('aws-sdk')
var mime = require('mime')

var S3Storage = function (properties) {
  this.bucket = properties.bucket
  this.s3Client = new AWS.S3({
    accessKeyId: properties.accessKeyId,
    secretAccessKey: properties.secretAccessKey
  })
}

S3Storage.prototype.listKeys = function (options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }
  this.s3Client.listObjects({Bucket: this.bucket, Marker: options.marker, MaxKeys: options.maxKeys}, function (err, data) {
    if (err) return cb(err)
    var result = {}
    result.done = !data.IsTruncated
    result.keys = data.Contents.map(obj => obj.Key)
    cb(null, result)
  })
}

S3Storage.prototype.saveFile = function (file, filename, cb) {
  return this.s3Client.putObject({
    Bucket: this.bucket,
    Key: filename,
    ACL: 'public-read',
    Body: file,
    ContentLength: file.byteCount,
    ContentType: mime.lookup(filename)
  }, cb)
}

S3Storage.prototype.getFile = function (filename, cb) {
  return this.s3Client.getObject({
    Bucket: this.bucket, /* required */
    Key: filename, /* required */
    ResponseContentType: 'application/json'
  }, cb)
}

module.exports = S3Storage
