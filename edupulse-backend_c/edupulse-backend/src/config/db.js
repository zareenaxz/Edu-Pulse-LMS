const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edupulse',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  dateStrings: true,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log(`MySQL connected: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
  } catch (err) {
    console.error(`MySQL connection error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
