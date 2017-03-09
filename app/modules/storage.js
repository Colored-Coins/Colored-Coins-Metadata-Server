var S3Storage = require('./s3-storage')

var Storage = function (properties) {
  if (properties.AWS) {
    var accessKeyId = properties.AWS.accessKeyId
    var secretAccessKey = properties.AWS.secretAccessKey
    var bucket = properties.AWS.S3bucket

    if (!accessKeyId || !secretAccessKey || !bucket) {
      throw new Error('Missing parameters for AWS S3 storage')
    }

    this.s3Client = new S3Storage({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      bucket: bucket
    })
  }
}

Storage.prototype.listKeys = function (options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }
  if (this.s3Client) {
    return this.s3Client.listKeys(options, cb)
  }
  throw new Error('Storage type not configured')
}

Storage.prototype.saveFile = function (file, filename, cb) {
  if (this.s3Client) {
    return this.s3Client.saveFile(file, filename, cb)
  }
  throw new Error('Storage type not configured')
}

Storage.prototype.getFile = function (filename, cb) {
  if (this.s3Client) {
    return this.s3Client.getFile(filename, cb)
  }
  throw new Error('Storage type not configured')
}

module.exports = Storage
