CREATE TABLE IF NOT EXISTS titles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('ANIME','FILM','SERIAL')),
  year INTEGER,
  description TEXT DEFAULT '',
  poster_url TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS titles_type_idx ON titles(type);
CREATE INDEX IF NOT EXISTS titles_title_idx ON titles(title);
