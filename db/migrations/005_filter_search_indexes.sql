CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_environments_name_trgm ON environments USING gin (name gin_trgm_ops);
CREATE INDEX idx_stores_name ON stores (name);
CREATE INDEX idx_stores_name_trgm ON stores USING gin (name gin_trgm_ops);
