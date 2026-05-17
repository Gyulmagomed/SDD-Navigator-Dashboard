INSERT INTO specifications (id, name, version, status, total_items, covered_items, coverage_percent, last_updated, owner)
SELECT
    'spec-' || gs,
    'Specification ' || gs,
    '1.0.0',
    CASE WHEN gs % 2 = 0 THEN 'active' ELSE 'draft' END,
    100,
    GREATEST(0, 100 - gs * 2),
    GREATEST(10, 100 - gs * 2),
    TIMESTAMPTZ '2026-03-20T10:00:00Z',
    CASE WHEN gs % 2 = 0 THEN 'team-a' ELSE 'team-b' END
FROM generate_series(1, 30) AS gs
ON CONFLICT (id) DO NOTHING;

INSERT INTO coverage_sections (id, spec_id, section, percent)
SELECT 'sec-arch-' || s.id, s.id, 'Architecture', 82
FROM specifications s
ON CONFLICT (id) DO NOTHING;

INSERT INTO coverage_sections (id, spec_id, section, percent)
SELECT 'sec-sec-' || s.id, s.id, 'Security', 45
FROM specifications s
ON CONFLICT (id) DO NOTHING;

INSERT INTO coverage_items (id, section_id, title, status, linked_components)
SELECT 'item-a-' || s.id, 'sec-arch-' || s.id, 'Service boundaries', 'covered', ARRAY['svc-a']
FROM specifications s
ON CONFLICT (id) DO NOTHING;

INSERT INTO coverage_items (id, section_id, title, status, linked_components)
SELECT 'item-s1-' || s.id, 'sec-sec-' || s.id, 'Input validation', 'partial', ARRAY['api-gw']
FROM specifications s
ON CONFLICT (id) DO NOTHING;

INSERT INTO coverage_items (id, section_id, title, status, linked_components)
SELECT 'item-s2-' || s.id, 'sec-sec-' || s.id, 'Audit trails', 'not_covered', ARRAY[]::TEXT[]
FROM specifications s
ON CONFLICT (id) DO NOTHING;
