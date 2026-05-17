package postgres

import (
	"context"
	"fmt"

	"sdd-navigator/backend/internal/domain"
)

type CoverageRepository struct {
	db *DB
}

func NewCoverageRepository(db *DB) *CoverageRepository {
	return &CoverageRepository{db: db}
}

func (r *CoverageRepository) ListBySpecID(ctx context.Context, specID string) ([]domain.CoverageMetric, error) {
	start := now()
	ctx, cancel := r.db.withTimeout(ctx)
	defer cancel()

	const sectionsQuery = `
		SELECT id, section, percent
		FROM coverage_sections
		WHERE spec_id = $1
		ORDER BY section ASC
	`

	rows, err := r.db.Pool.Query(ctx, sectionsQuery, specID)
	if err != nil {
		return nil, fmt.Errorf("list coverage sections: %w", err)
	}
	defer rows.Close()

	type sectionRow struct {
		id      string
		section string
		percent float64
	}

	sections := make([]sectionRow, 0, 4)
	sectionIDs := make([]string, 0, 4)
	for rows.Next() {
		var row sectionRow
		if err := rows.Scan(&row.id, &row.section, &row.percent); err != nil {
			return nil, fmt.Errorf("scan coverage section: %w", err)
		}
		sections = append(sections, row)
		sectionIDs = append(sectionIDs, row.id)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate coverage sections: %w", err)
	}

	itemsBySection, err := r.listItemsBySectionIDs(ctx, sectionIDs)
	if err != nil {
		return nil, err
	}

	metrics := make([]domain.CoverageMetric, 0, len(sections))
	for _, section := range sections {
		metrics = append(metrics, domain.CoverageMetric{
			SpecID:  specID,
			Section: section.section,
			Percent: section.percent,
			Items:   itemsBySection[section.id],
		})
	}

	r.db.observe("coverage.list_by_spec", start)
	return metrics, nil
}

func (r *CoverageRepository) listItemsBySectionIDs(ctx context.Context, sectionIDs []string) (map[string][]domain.CoverageItem, error) {
	result := make(map[string][]domain.CoverageItem, len(sectionIDs))
	if len(sectionIDs) == 0 {
		return result, nil
	}

	const query = `
		SELECT section_id, id, title, status, linked_components
		FROM coverage_items
		WHERE section_id = ANY($1)
		ORDER BY section_id ASC, title ASC
	`

	rows, err := r.db.Pool.Query(ctx, query, sectionIDs)
	if err != nil {
		return nil, fmt.Errorf("list coverage items: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var sectionID string
		var item domain.CoverageItem
		if err := rows.Scan(&sectionID, &item.ID, &item.Title, &item.Status, &item.LinkedComponents); err != nil {
			return nil, fmt.Errorf("scan coverage item: %w", err)
		}
		result[sectionID] = append(result[sectionID], item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate coverage items: %w", err)
	}

	return result, nil
}
