var casimir = global.casimir
var server = casimir.server
var properties = casimir.properties
var logger = casimir.logger
var MetadataHandler = require('cc-metadata-handler')
var Seeder = require('./app/modules/seeder.js')
var fs = require('graceful-fs')

var torrentProperties = {
  client: {
    // torrentPort: 13231,
    // dhtPort: 20000,
  // Enable DHT (default=true), or options object for DHT
    dht: true,
  // Max number of peers to connect to per torrent (default=100)
  //  maxPeers: 100,
  // DHT protocol node ID (default=randomly generated)
    // nodeId: '2d5757303036322d353237613237393366316530',
  // Wire protocol peer ID (default=randomly generated)
    // peerId: '02f02fe0a5287da667933d06bcd8a5d69d50c904',
  // RTCPeerConnection configuration object (default=STUN only)
    // rtcConfig: Object,,
  // custom storage engine, or `false` to use in-memory engine
    // storage: Function,
  // List of additional trackers to use (added to list in .torrent or magnet uri)
    announce: [],
  // List of web seed urls (see [bep19](http://www.bittorrent.org/beps/bep_0019.html))
    // urlList: []
  // Whether or not to enable trackers (default=true)
    tracker: false
  },
  folders: {
    torrents: './torrents',
    data: './data',
    capSize: '80%',
    retryTime: 10000,
    autoWatchInterval: 60000,
    ignores: []
  },
  cliView: {
    streamData: false,
    cliViewStatus: false
  }
}

var folders = []
folders.push(torrentProperties.folders.torrents)
folders.push(torrentProperties.folders.data)
folders.push('./localdata')
folders.forEach(function (dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
})

server.http_server.listen(server.port, function (err) {
  if (err) {
    logger.info('Critical Error so killing server - ' + err)
    casimir.running = false
    return process.exit(1)
  }
  logger.info('Finished Loading the Server, server started on port ' + server.port)
  casimir.running = true
  casimir.handler = new MetadataHandler(torrentProperties)
  if (properties.torrent.seed !== 'false') {
    var seeder = new Seeder(properties.torrent)
    seeder.seed()
  }
})

