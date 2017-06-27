const net = require('net')

const client = net.connect(3000)
client.on('connect', () => {
  client.write('Msg do cliente')
})
client.on('data', (m) => {
  console.log(m.toString())
  console.log(JSON.stringify(m.toString()))
})

process.stdin.on('readable', () => {
  var message = process.stdin.read()
  if (!message) return
  message = message.toString().replace(/\n/, '')
  client.write(message)
})
