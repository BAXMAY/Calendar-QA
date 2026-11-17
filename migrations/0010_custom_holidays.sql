-- Migration 0010: custom_holidays table for configurable holidays, shutdown plant, and no customer audits
CREATE TABLE IF NOT EXISTS custom_holidays (
  date TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
