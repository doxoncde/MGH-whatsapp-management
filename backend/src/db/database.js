import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const DB_PATH = join(DATA_DIR, 'mgh.db');

let db;

async function initDb() {
  if (db) return db;
  
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  
  const SQL = await initSqlJs();
  
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // Run migrations
  const migrationPath = join(__dirname, 'migrations', '001_initial.sql');
  if (existsSync(migrationPath)) {
    const sql = readFileSync(migrationPath, 'utf-8');
    db.run(sql);
    saveDb();
  }
  
  return db;
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  }
}

// Wrapper that provides better-sqlite3-compatible interface
export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  
  return {
    prepare(sql) {
      return {
        get(...params) {
          try {
            db.run('BEGIN');
            const stmt = db.prepare(sql);
            stmt.bind(params);
            if (stmt.step()) {
              const cols = stmt.getColumnNames();
              const vals = stmt.get();
              stmt.free();
              db.run('COMMIT');
              const row = {};
              cols.forEach((col, i) => row[col] = vals[i]);
              return row;
            }
            stmt.free();
            db.run('COMMIT');
            return null;
          } catch (e) {
            db.run('ROLLBACK');
            console.error('[DB] get error:', sql, params, e.message);
            return null;
          }
        },
        all(...params) {
          try {
            const results = [];
            db.run('BEGIN');
            const stmt = db.prepare(sql);
            stmt.bind(params);
            while (stmt.step()) {
              const cols = stmt.getColumnNames();
              const vals = stmt.get();
              const row = {};
              cols.forEach((col, i) => row[col] = vals[i]);
              results.push(row);
            }
            stmt.free();
            db.run('COMMIT');
            return results;
          } catch (e) {
            db.run('ROLLBACK');
            console.error('[DB] all error:', sql, params, e.message);
            return [];
          }
        },
        run(...params) {
          try {
            db.run(sql, params);
            saveDb();
            return { changes: db.getRowsModified() };
          } catch (e) {
            console.error('[DB] run error:', sql, params, e.message);
            return { changes: 0 };
          }
        },
      };
    },
    exec(sql) {
      db.run(sql);
      saveDb();
    },
    close() {
      saveDb();
      db.close();
    },
  };
}

export { initDb, saveDb };

// Run directly for db:init
if (process.argv.includes('--init')) {
  await initDb();
  console.log(`Database initialized at ${DB_PATH}`);
  process.exit(0);
}
