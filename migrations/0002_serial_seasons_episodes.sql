CREATE TABLE IF NOT EXISTS seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_id INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE,
  UNIQUE(title_id, season_number)
);
CREATE INDEX IF NOT EXISTS seasons_title_idx ON seasons(title_id, season_number);

CREATE TABLE IF NOT EXISTS episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  video_file_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  UNIQUE(season_id, episode_number)
);
CREATE INDEX IF NOT EXISTS episodes_season_idx ON episodes(season_id, episode_number);
