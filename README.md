Para rodar o projeto precisa ter instalado o NODEJS, MySQL e o Memcached
Para configurar o mysql é preciso apenas setar as credenciais
// Conexao com o banco

var conn = mysql.createConnection({
  host: 'localhost',
  database: 'checkflight',
  user: 'root',
  password: 'root'
})

As configurações do servidor ficam no config.json
por padrão a porta que o cliente tentará acessar é a 3000
