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
    if (m.includes('mem')) {
      memcached.get('SD_ListServers', (err, data) => {
        if (err) throw err
        // checa se existe
        if (data !== undefined) {
          let localServers = data
          // percorre os servidores
          localServers.servers.forEach((e) => {
            // checa se o servidor esta na lista
            if (e.name == config.serverName) {
              // apenas confirma os dados
              e.location = config.serverIP + ':' + config.portListen
              e.year = config.yearData
              e.active = true
            } else {
              // inclui o servidor no cache
              localServers.servers.push(servers.servers[0])
              memcached.set('SD_ListServers', localServers, 0, function (err) {
                if (err) throw err
              })
            }
          })

          c.write(JSON.stringify(localServers))
        } else {
          // não existe, cria
          memcached.set('SD_ListServers', servers, 0, function (err) {
            if (err) throw err
          })
        }
      })
    }
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
      // let delayData = {
      //   'arrivalOnTimeFlights': 123,
      //   'arrivalDelayedFlights': 456,
      //   'arrivalDelayedAverageTime': '00:00:12',
      //   'departureOnTimeFlights': 789,
      //   'departureDelayedFlights': 12,
      //   'departureDelayedAverageTime': '00:00:12'
      // }
      // conn.connect(function (err) {
      //   if (err) {
      //     return
      //   }
      // })
      // conn.query('SELECT * FROM carriers', function (err, results) {
      //   if (err) throw err
      //
      //   results.forEach((result) => {
      //     var carrier = {}
      //     carrier.code = result.code
      //     carrier.description = result.description
      //     carriers['carriers'].push(carrier)
      //   })
      //   c.write(JSON.stringify(delayData))
      // })
      // conn.end()
    }
  })
})
server.listen(config.portListen)
// fecha servidor, retida do memcached
server.on('close', function() {
  memcached.get('SD_ListServers', (err, data) => {
    if (err) throw err
    if (data !== undefined) {
      let localServers = data
      localServers.servers.forEach((e) => {
        if (e.name == config.serverName) {
          e.active = false
        }
      })
      // inclui o servidor no cache
      memcached.set('SD_ListServers', localServers, 0, function (err) {
        if (err) throw err
      })
    }
  })
})
