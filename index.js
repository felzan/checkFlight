const net = require('net')
const mysql = require('mysql')

// Conexao com o banco
var conn = mysql.createConnection({
  host: 'localhost',
  database: 'checkflight',
  user: 'root',
  password: 'root'
})

var config = {
  'serverName': 'felzan',
  'serverIP': '127.0.0.1',
  'portListen': 1111,
  'memcachedServer': '10.1.1.1',
  'memcachedPort': 11211,
  'yearData': [1999, 2000]
}
var resp = {}
resp.servers = {}
resp.servers.name = 'felzan'
resp.servers.location = 'localhost:3000'
resp.servers.year = '2000'
resp.servers.active = true

net.createServer((c) => {
  c.on('data', (m) => {
    if (m.includes('GETAIRPORTS')) {
      let airports = {
        'airports': []
      }
      conn.connect(function (err) {
        if (err) {
          return
        }
      })
      conn.query('SELECT a.iata, a.airport, a.city, a.lat, a.`long` FROM airports a', function (err, results) {
        if (err) throw err

        results.forEach((result) => {
          var airport = {}
          airport.iata = result.iata
          airport.name = result.airport
          airport.city = result.city
          airport.lat = result.lat
          airport.lng = result.long
          airports['airports'].push(airport)
        })
        c.write(JSON.stringify(airports))
      })
      conn.end()
    } else if (m.includes('GETCARRIERS')) {
      let carriers = {
        'carriers': []
      }
      conn.connect(function (err) {
        if (err) {
          return
        }
      })
      conn.query('SELECT * FROM carriers', function (err, results) {
        if (err) throw err

        results.forEach((result) => {
          var carrier = {}
          carrier.code = result.Code
          carrier.description = result.Description
          carriers['carriers'].push(carrier)
        })
        c.write(JSON.stringify(carriers))
      })
      conn.end()
    } else if (m.includes('GETDELAYDATA')) {
      let delayData = {
        'arrivalOnTimeFlights': 123,
        'arrivalDelayedFlights': 456,
        'arrivalDelayedAverageTime': '00:00:12',
        'departureOnTimeFlights': 789,
        'departureDelayedFlights': 12,
        'departureDelayedAverageTime': '00:00:12'
      }
      conn.connect(function (err) {
        if (err) {
          return
        }
      })
      conn.query('SELECT * FROM carriers', function (err, results) {
        if (err) throw err

        results.forEach((result) => {
          var carrier = {}
          carrier.code = result.code
          carrier.description = result.description
          carriers['carriers'].push(carrier)
        })
        c.write(JSON.stringify(delayData))
      })
      conn.end()
    }
  })
}).listen(3000)
