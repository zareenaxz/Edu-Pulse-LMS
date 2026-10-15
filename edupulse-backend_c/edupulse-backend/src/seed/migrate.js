// Runs schema.sql (verbatim, as supplied) against MySQL to create the database/tables
// and seed the initial categories + badges rows that are already part of that file.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate() {
  const sqlPath = path.join(__dirname, '..', '..', 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // No database selected yet (schema.sql itself does CREATE DATABASE + USE),
  // so connect without a `database` option.
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('Running schema.sql ...');
  await connection.query(sql);
  console.log('Schema created/updated successfully.');
  await connection.end();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
