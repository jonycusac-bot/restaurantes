CREATE TABLE IF NOT EXISTS inch_draft (
  id TEXT PRIMARY KEY CHECK (id = 'inch'),
  dishes TEXT NOT NULL CHECK (json_valid(dishes)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS inch_publication (
  id TEXT PRIMARY KEY CHECK (id = 'inch'),
  html TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  source_revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS inch_images (
  id TEXT PRIMARY KEY,
  mime_type TEXT NOT NULL,
  bytes BLOB NOT NULL CHECK (length(bytes) <= 1048576),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS inch_login_attempts (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS inch_login_expiry ON inch_login_attempts(expires);
