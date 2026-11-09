CREATE INDEX idx_environments_name ON environments (name);
CREATE INDEX idx_environments_store_name ON environments (store_id, name);
CREATE INDEX idx_environments_seen_comfort ON environments (last_comfort_status)
    WHERE last_seen_at IS NOT NULL;
