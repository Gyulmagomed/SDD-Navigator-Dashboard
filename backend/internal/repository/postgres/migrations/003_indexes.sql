CREATE INDEX IF NOT EXISTS idx_specifications_last_updated ON specifications(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_specifications_name_trgm ON specifications(name);
CREATE INDEX IF NOT EXISTS idx_coverage_items_section_id ON coverage_items(section_id);
