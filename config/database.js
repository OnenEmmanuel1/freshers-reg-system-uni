const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'rootpassword',
  database: process.env.DB_NAME || 'unicross_freshers_reg_db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};

let pool = null;
let isConnected = false;

// Initialize MySQL pool and test connection
async function initDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log(`[UniRegister DB] Connected to MySQL database "${dbConfig.database}" at ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    isConnected = true;
    return true;
  } catch (err) {
    console.warn(`[UniRegister DB Warning] Could not connect to MySQL: ${err.message}`);
    console.warn(`[UniRegister DB Warning] Ensure MySQL service is running or use Docker Compose. App will attempt auto-reconnect on queries.`);
    isConnected = false;
    return false;
  }
}

async function query(sql, params = []) {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  try {
    const [rows, fields] = await pool.execute(sql, params);
    return rows;
  } catch (err) {
    console.error(`[UniRegister DB Error] Query failed: ${err.message}`);
    throw err;
  }
}

async function getConnection() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return await pool.getConnection();
}

module.exports = {
  initDatabase,
  query,
  getConnection,
  getPool: () => pool,
  isDbConnected: () => isConnected
};
