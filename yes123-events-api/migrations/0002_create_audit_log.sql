-- 0002_create_audit_log.sql
-- 审核日志表

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT DEFAULT '',
  old_status TEXT,
  new_status TEXT,
  ai_reason TEXT,
  ai_confidence REAL,
  raw_input TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_event_id ON audit_log(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
