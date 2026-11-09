CREATE TABLE clients (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    segment VARCHAR(50) NOT NULL
);

CREATE TABLE stores (
    id VARCHAR(20) PRIMARY KEY,
    client_id VARCHAR(20) NOT NULL REFERENCES clients (id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    uf CHAR(2) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    operating_hours JSONB NOT NULL,
    CONSTRAINT stores_uf_len CHECK (char_length(uf) = 2)
);
CREATE INDEX idx_stores_client_city ON stores (client_id, city);

CREATE TABLE environments (
    id VARCHAR(20) PRIMARY KEY,
    store_id VARCHAR(20) NOT NULL REFERENCES stores (id),
    name VARCHAR(100) NOT NULL,
    comfort_min DOUBLE PRECISION NOT NULL,
    comfort_max DOUBLE PRECISION NOT NULL,
    operating_hours JSONB NOT NULL,
    dev_id VARCHAR(20) NOT NULL UNIQUE,
    last_seen_at TIMESTAMPTZ,
    last_temp DOUBLE PRECISION,
    last_comfort_status VARCHAR(15),
    is_currently_operating BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT environments_comfort_range CHECK (comfort_min <= comfort_max),
    CONSTRAINT environments_comfort_status CHECK (
        last_comfort_status IS NULL
        OR last_comfort_status IN ('IN_RANGE', 'ABOVE', 'BELOW')
    )
);
CREATE INDEX idx_environments_store ON environments (store_id);

CREATE TABLE users (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    profile VARCHAR(30) NOT NULL,
    client_id VARCHAR(20) REFERENCES clients (id),
    allowed_store_ids TEXT[] NOT NULL DEFAULT '{}',
    CONSTRAINT users_profile CHECK (
        profile IN ('network_manager', 'store_manager', 'diel_operator')
    ),
    CONSTRAINT users_client_scope CHECK (
        (
            profile = 'diel_operator'
            AND client_id IS NULL
            AND cardinality(allowed_store_ids) = 0
        )
        OR (
            profile = 'network_manager'
            AND client_id IS NOT NULL
        )
        OR (
            profile = 'store_manager'
            AND client_id IS NOT NULL
            AND cardinality(allowed_store_ids) > 0
        )
    )
);
