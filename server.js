const net = require('net')
const mysql = require('mysql')
const config = require('./config.json')
const Memcached = require('memcached')
const memcached = new Memcached(config.memcachedServer + ':' + config.memcachedPort)

// Conexao com o banco
var conn = mysql.createConnection({
  host: 'localhost',
  database: 'checkflight',
  user: 'root',
  password: 'root'
})
const cn = () => {
  conn.connect(function (err) {
    if (err) throw err
  })
}
// Memcached
// memcached.get('foo', function (err, data) {
//   if (err) throw err
//   console.log(data)
// })
let servers = {
  'servers': [
    {
      'name': config.serverName,
      'location': config.serverIP + ':' + config.portListen,
      'year': config.yearData,
      'active': true
    }
  ]
}

const server = net.createServer((c) => {
  c.on('data', (m) => {
    if (m.includes('GETAIRPORTS')) {
      let airports = {
        'airports': []
      }
      memcached.get('SD_Airports', (err, data) => {
        if (err) throw err
        if (data !== undefined) {
          c.write(JSON.stringify(data))
        } else {
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
          memcached.set('SD_Airports', airports, 0, function (err) {
            if (err) throw err
          })
          c.write(JSON.stringify(airports))
        })
        }
      })
    } else if (m.includes('GETCARRIERS')) {
      let carriers = {
        'carriers': []
      }
      memcached.get('SD_Carriers', (err, data) => {
        if (err) throw err
        if (data !== undefined) {
          c.write(JSON.stringify(data))
        } else {
          conn.query('SELECT * FROM carriers', function (err, results) {
            if (err) throw err

            results.forEach((result) => {
              var carrier = {}
              carrier.code = result.Code
              carrier.description = result.Description
              carriers['carriers'].push(carrier)
            })
            memcached.set('SD_Carriers', carriers, 0, function (err) {
              if (err) throw err
            })
            c.write(JSON.stringify(carriers))
          })
        }
      })
    } else if (m.toString().indexOf('GETDELAYDATA') !== -1) {
      var d = m.toString().split(' ')
      let delayData = {
        'arrivalOnTimeFlights': 0,
        'arrivalDelayedFlights': 0,
        'arrivalDelayedAverageTime': '',
        'departureOnTimeFlights': 0,
        'departureDelayedFlights': 0,
        'departureDelayedAverageTime': ''
      }
      var arrivalOnTimeFlightsQuery = "SELECT count(*) FROM flights where ArrDelay = 0 and ArrDelay != 'NA' and Cancelled = 0"
      var arrivalDelayedFlightsQuery = "SELECT count(*) FROM flights where ArrDelay > 0 and ArrDelay != 'NA' and Cancelled = 0"
      var arrivalDelayedAverageTimeQuery = "SELECT SEC_TO_TIME(AVG(ArrDelay) * 60) FROM flights where ArrDelay > 0 and ArrDelay != 'NA' and Cancelled = 0"
      var departureOnTimeFlightsQuery = "SELECT count(*) FROM flights where DepDelay = 0 and DepDelay != 'NA' and Cancelled = 0"
      var departureDelayedFlightsQuery = "SELECT count(*) FROM flights where DepDelay > 0 and DepDelay != 'NA' and Cancelled = 0"
      var departureDelayedAverageTimeQuery = "SELECT SEC_TO_TIME(AVG(DepDelay) * 60) FROM flights where DepDelay > 0 and DepDelay != 'NA' and Cancelled = 0"

      var endQuery = ''

      if (d.length == 2) {
        if (d[1].length == 4) {
          endQuery += ' AND Year = ' + d[1]
        } else if (d[1].length == 6) {
          endQuery += ' AND Year = ' + d[1].substring(0,4) + ' AND Month = ' + d[1].substring(4,6)
        } else if (d[1].length == 8) {
          endQuery += ' AND Year = ' + d[1].substring(0,4) + ' AND Month = ' + d[1].substring(4,6) + ' AND DayofMonth = ' + d[1].substring(6,8)
        }
      } else if (d.length == 3) {
        if (d[1].length == 4) {
          endQuery += ' AND Year = ' + d[1]
        } else if (d[1].length == 6) {
          endQuery += ' AND Year = ' + d[1].substring(0,4) + ' AND Month = ' + d[1].substring(4,6)
        } else if (d[1].length == 8) {
          endQuery += ' AND Year = ' + d[1].substring(0,4) + ' AND Month = ' + d[1].substring(4,6) + ' AND DayofMonth = ' + d[1].substring(6,8)
        }
        endQuery += ' AND (Origin = ' + d[2] + ' OR Dest = ' + d[2] + ')'
      } else if (d.length == 4) {
        if (d[1].length == 4) {
          endQuery += ' AND Year = ' + d[1]
        } else if (d[1].length == 6) {
          endQuery += ' AND Year = ' + d[1].substring(0,4) + ' AND Month = ' + d[1].substring(4,6)
        } else if (d[1].length == 8) {
          endQuery += ' AND Year = ' + d[1].substring(0,4) + ' AND Month = ' + d[1].substring(4,6) + ' AND DayofMonth = ' + d[1].substring(6,8)
        }
        if (d[2] !== '***') {
          endQuery += ' AND (Origin = ' + d[2] + ' OR Dest = ' + d[2] + ')'
        }
        endQuery += ' AND UniqueCarrier = ' + d[3]

      }
      // execute queries
      conn.query(arrivalOnTimeFlightsQuery + endQuery, function (err, results) {
      if (err) throw err
      console.log('1 query ' + results[0])
      delayData.arrivalOnTimeFlights = results[0]
      })
      conn.query(arrivalDelayedFlightsQuery + endQuery, function (err, results) {
      if (err) throw err

      delayData.arrivalDelayedFlights = results[0]
      })
      conn.query(arrivalDelayedAverageTimeQuery + endQuery, function (err, results) {
      if (err) throw err

      delayData.arrivalDelayedAverageTime = results[0]
      })
      conn.query(departureOnTimeFlightsQuery + endQuery, function (err, results) {
      if (err) throw err

      delayData.departureOnTimeFlights = results[0]
      })
      conn.query(departureDelayedFlightsQuery + endQuery, function (err, results) {
      if (err) throw err

      delayData.departureDelayedFlights = results[0]
      })
      conn.query(departureDelayedAverageTimeQuery + endQuery, function (err, results) {
      if (err) throw err

      delayData.departureDelayedAverageTime = results[0]
      })

      c.write(JSON.stringify(delayData))

    } else if (m.includes('GETAVAILABLEYEARS')) {
      var availableYears = {
        'years': []
      }
      memcached.get('SD_ListServers', (err, data) => {
        if (err) throw err
        let localServers = data
        if (data !== undefined) {
          localServers.servers.forEach((e) => {
            e.year.forEach((y) => {
              if (availableYears.years.indexOf(y) == -1) {
                availableYears.years.push(y)
              }
            })
          })
          c.write(JSON.stringify(availableYears))
        }
      })
    }
  })
})
server.listen(config.portListen, () => {
  // Lista de servidores
  memcached.get('SD_ListServers', (err, data) => {
    if (err) throw err
    let localServers = data
    if (data !== undefined) {
      var itsme = false
      localServers.servers.forEach((e) => {
        if (e.name == config.serverName) {
          itsme = true
          e.location = config.serverIP + ':' + config.portListen
          e.year = config.yearData
          e.active = true
        }
        if (!itsme) {
          localServers.servers.push(servers.servers[0])
          memcached.set('SD_ListServers', localServers, 0, function (err) {
            if (err) throw err
          })
        }
      })
    } else {
      memcached.set('SD_ListServers', servers, 0, function (err) {
        if (err) throw err
      })
    }
  })


})
