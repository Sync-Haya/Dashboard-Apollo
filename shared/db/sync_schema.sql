-- Sync run tracking table
CREATE TABLE IF NOT EXISTS sync_runs (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'RUNNING',
  total_extracted INT DEFAULT 0,
  total_posted INT DEFAULT 0,
  total_skipped INT DEFAULT 0,
  total_errors INT DEFAULT 0,
  log_path TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_runs_started ON sync_runs(started_at);

-- Individual sync items tracking
CREATE TABLE IF NOT EXISTS sync_items (
  id SERIAL PRIMARY KEY,
  run_id INT REFERENCES sync_runs(id),
  sistema VARCHAR(20),
  external_id VARCHAR(100),
  titulo TEXT,
  status VARCHAR(50),
  prioridade VARCHAR(50),
  cliente TEXT,
  atendente TEXT,
  data_abertura TEXT,
  action VARCHAR(20),
  http_status INT,
  api_response TEXT,
  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_items_run ON sync_items(run_id);
CREATE INDEX IF NOT EXISTS idx_sync_items_ext ON sync_items(external_id, sistema);
