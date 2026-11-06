-- D1 schema for the contact form. Apply with: npm run db:init (local) / npm run db:init:remote
CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  phone      TEXT,
  service    TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  lang       TEXT,
  ip_hash    TEXT,
  status     TEXT    NOT NULL DEFAULT 'new'  -- new | replied | archived
);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at);
CREATE INDEX IF NOT EXISTS idx_messages_ip      ON messages (ip_hash, created_at);
