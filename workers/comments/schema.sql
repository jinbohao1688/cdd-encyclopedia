-- CDD Encyclopedia 评论系统数据库表结构
-- 数据库: waline-db (Cloudflare D1)
-- ID: 5a66c5bb-c386-4ff6-9770-956bd3378624

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  author TEXT NOT NULL,
  email TEXT DEFAULT '',
  content TEXT NOT NULL,
  parent_id INTEGER DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'approved',
  likes INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_comments_path ON comments(path);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
