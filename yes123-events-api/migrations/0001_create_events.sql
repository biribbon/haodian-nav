-- 0001_create_events.sql
-- 活动数据主表

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  end_date TEXT,
  city TEXT NOT NULL,
  address TEXT,
  lng REAL,
  lat REAL,
  category TEXT NOT NULL DEFAULT 'meetup',
  tags TEXT DEFAULT '[]',
  url TEXT DEFAULT '',
  source TEXT DEFAULT '',
  source_platform TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  organizer TEXT DEFAULT '',
  theme TEXT DEFAULT '',
  free INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
