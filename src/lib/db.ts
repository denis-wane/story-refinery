import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "story-refinery.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require("fs");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id TEXT PRIMARY KEY,
      mode TEXT NOT NULL CHECK (mode IN ('generate', 'refine')),
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed')),
      input TEXT NOT NULL,
      refine_source TEXT CHECK (refine_source IN ('jira', 'local')),
      refine_path TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pipeline_steps (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      agent TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'completed', 'failed', 'review_pending', 'skipped')),
      input TEXT,
      output TEXT,
      error TEXT,
      review_gate INTEGER NOT NULL DEFAULT 0,
      started_at TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      step_id TEXT NOT NULL REFERENCES pipeline_steps(id) ON DELETE CASCADE,
      run_id TEXT NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
      comments TEXT NOT NULL,
      approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_steps_run ON pipeline_steps(run_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_reviews_step ON reviews(step_id);
  `);
}
