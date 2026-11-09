CREATE TABLE raw_batches (
    batch_key VARCHAR(255) PRIMARY KEY,
    client_id VARCHAR(20) NOT NULL REFERENCES clients (id),
    recorded_at TIMESTAMPTZ NOT NULL,
    packet_count INTEGER NOT NULL CHECK (packet_count >= 0)
);
CREATE INDEX idx_raw_batches_client_day
    ON raw_batches (client_id, recorded_at);
