const net = require('net')
var resp = {}
resp.servers = {}
resp.servers.name = 'felzan'
resp.servers.location = 'localhost:3000'
resp.servers.year = '2000'
resp.servers.active = true

var carriers = {
  'carriers': [
    {
      'code': 'AA',
      'name': 'American Airlines'
    },
    {
      'iata': 'AR',
      'name': 'Aerolineas Argentinas'
    }
  ]
}
// var connections = []
net.createServer((c) => {
  c.write('Msg do servidor')
  c.on('data', (m) => {
    if (m.includes('ok')) {
      c.write(JSON.stringify(carriers))
    }
    console.log(m.toString())
  })
}).listen(3000)
