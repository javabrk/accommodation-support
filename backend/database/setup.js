require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function setup() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('Database schema created successfully.');
  } catch (err) {
    console.error('Error setting up database:', err.message);
  } finally {
    await pool.end();
  }
}

setup();
