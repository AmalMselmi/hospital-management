const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/patients.db');
const db = new Database(dbPath);

// Create patients table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id    TEXT PRIMARY KEY,
    name  TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    age   INTEGER NOT NULL
  )
`);

module.exports = db;