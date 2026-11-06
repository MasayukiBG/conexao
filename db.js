// Conexão com o MySQL (o mesmo servidor que o MySQL Workbench acessa).
// Ajuste os dados abaixo ou use variáveis de ambiente.
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'sua_senha_aqui', // <- troque pela senha da sua conexão no Workbench
  database: process.env.DB_NAME || 'projeto_crud',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
