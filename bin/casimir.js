var jwt = require('jwt-simple')
var path = require('path')
var casimirCore = require('casimircore')()
var properties = casimirCore.properties(path.join(__dirname, '/../config/'))

properties.torrent.seedBulkSize = process.env.SEED_BULK_SIZE || properties.torrent.seedBulkSize
properties.torrent.seedBulkIntervalInMs = process.env.SEED_BULK_INTERVAL_MS || properties.torrent.seedBulkIntervalInMs
properties.torrent.seed = process.env.SEED || properties.torrent.seed
properties.torrent.fromTorrentHash = process.env.FROM_TORRENT_HASH || properties.torrent.fromTorrentHash
properties.AWS.accessKeyId = process.env.AWS_ACCESS_KEY_ID || properties.AWS.accessKeyId
properties.AWS.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || properties.AWS.secretAccessKey
properties.AWS.S3bucket = process.env.AWS_S3_BUCKET || properties.AWS.S3bucket

var logSettings = {
  level: properties.log && properties.log.level,
  logentries_api_key: properties.log && properties.log.logentries_api_key,
  log_dir: path.join(__dirname, '/../app/log')
}

var logger = global.logger = casimirCore.logger(logSettings)
// Log console.log to logger.debug
console.log = logger.info
// Log console.error to logger.error
console.error = logger.error
// Log console.warn to logger.warn
console.warn = logger.warn

// //////// Routes Files /////// //
var routesDir = path.join(__dirname, '/../routes/')

var Storage = require(path.join(__dirname, '/../app/modules/storage.js'))
var storage = new Storage(properties)

var verifyCallback = function (jwtToken, req, res, next) {
  if (!properties.JWT.jwtTokenSecret) {
    return next()
  }
  try {
    var decoded = jwt.decode(jwtToken, properties.JWT.jwtTokenSecret)
    var expiration = Date.parse(decoded.exp)
    if (expiration > Date.now()) {
      req.user = decoded.iss
    }
  } catch (e) {
    // decoding failed, no req.user
  }
  next()
}

var accessCallback = function (req, res, next) {
  if (!properties.JWT.jwtTokenSecret) {
    return next() // if no JWT secret is provided, consider this a public end-point
  }
  next(['Unauthorized', 401])
}

var authentication = casimirCore.authentication(verifyCallback, accessCallback)

var requestid
var requestSettings
if (properties.JWT.jwtTokenSecret) {
  requestSettings = {
    secret: properties.JWT.jwtTokenSecret,
    namespace: properties.server.name
  }
  requestid = casimirCore.request_id(requestSettings)
}

// Add custom framwork modules for server
properties.modules = {
  router: casimirCore.router(routesDir, path.join(__dirname, '/../app/controllers/'), authentication),
  error: casimirCore.error(properties.ENV.type),
  logger: logger
}
if (requestid) {
  properties.modules.requestid = requestid
}

// handle relative path issue when running globally
properties.server.favicon = properties.server.favicon && path.join(__dirname, '..', properties.server.favicon)
properties.engine.view_folder = properties.engine.view_folder && path.join(__dirname, '..', properties.engine.view_folder)
properties.engine.static_folder = properties.engine.static_folder && path.join(__dirname, '..', properties.engine.static_folder)

// Set server and server port
var server = casimirCore.server(properties)

module.exports = {
  server: server,
  logger: logger,
  properties: properties,
  authentication: authentication,
  storage: storage
}
