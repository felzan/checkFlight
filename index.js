const net = require('net')
var resp = {}
resp.servers = {}
resp.servers.name = 'felzan'
resp.servers.location = 'localhost:3000'
resp.servers.year = '2000'
resp.servers.active = true

var connections = []
net.createServer((c) => {
  c.write('Msg do servidor')
  c.on('data', (m) => {
    if (m.includes('ok')) {
      c.write(resp.toString())
      console.log('AGORAa')
    }
    console.log(m.toString())
  })
}).listen(3000)
