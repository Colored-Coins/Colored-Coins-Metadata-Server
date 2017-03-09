var path = require('path')
global.casimir = require(path.join(__dirname, '/bin/casimir'))
require('./startup.js')
