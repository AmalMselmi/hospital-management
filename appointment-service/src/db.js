const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/appointments.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id          TEXT PRIMARY KEY,
    patient_id  TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    date        TEXT NOT NULL,
    time        TEXT NOT NULL,
    reason      TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'scheduled'
  )
`);

module.exports = db;