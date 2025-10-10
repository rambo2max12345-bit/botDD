// db.js - SQLite helper + schema
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dayjs = require('dayjs');
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');

let db;

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function initDb() {
  db = new sqlite3.Database(DB_PATH);
  await run(`CREATE TABLE IF NOT EXISTS leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    start_date TEXT,
    end_date TEXT,
    reason TEXT,
    created_by TEXT,
    created_at TEXT
  )`);
  await run(`CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    shift_no INTEGER,
    start_time TEXT,
    end_time TEXT,
    person TEXT
  )`);
  await run(`CREATE TABLE IF NOT EXISTS summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    content TEXT,
    created_at TEXT
  )`);
  console.log('DB initialized at', DB_PATH);
}

module.exports = { initDb, run, all, get };