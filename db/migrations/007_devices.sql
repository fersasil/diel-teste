CREATE TABLE devices (
    dev_id VARCHAR(20) PRIMARY KEY,
    environment_id VARCHAR(20) NOT NULL UNIQUE REFERENCES environments (id)
);

INSERT INTO devices (dev_id, environment_id)
SELECT dev_id, id FROM environments
ON CONFLICT (dev_id) DO NOTHING;
