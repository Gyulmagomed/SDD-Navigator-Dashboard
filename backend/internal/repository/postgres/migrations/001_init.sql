CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS specifications (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT NOT NULL,
    total_items INT NOT NULL,
    covered_items INT NOT NULL,
    coverage_percent DOUBLE PRECISION NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    owner TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS coverage_sections (
    id TEXT PRIMARY KEY,
    spec_id TEXT NOT NULL REFERENCES specifications(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    percent DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS coverage_items (
    id TEXT PRIMARY KEY,
    section_id TEXT NOT NULL REFERENCES coverage_sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    linked_components TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_specifications_status ON specifications(status);
CREATE INDEX IF NOT EXISTS idx_specifications_owner ON specifications(owner);
CREATE INDEX IF NOT EXISTS idx_coverage_sections_spec_id ON coverage_sections(spec_id);
