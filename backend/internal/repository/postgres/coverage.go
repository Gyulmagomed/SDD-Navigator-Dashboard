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

	metrics := make([]domain.CoverageMetric, 0, 4)
	for rows.Next() {
		var sectionID, section string
		var percent float64
		if err := rows.Scan(&sectionID, &section, &percent); err != nil {
			return nil, fmt.Errorf("scan coverage section: %w", err)
		}

		items, err := r.listItems(ctx, sectionID)
		if err != nil {
			return nil, err
		}

		metrics = append(metrics, domain.CoverageMetric{
			SpecID:  specID,
			Section: section,
			Percent: percent,
			Items:   items,
		})
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate coverage sections: %w", err)
	}

	return metrics, nil
}

func (r *CoverageRepository) listItems(ctx context.Context, sectionID string) ([]domain.CoverageItem, error) {
	const query = `
		SELECT id, title, status, linked_components
		FROM coverage_items
		WHERE section_id = $1
		ORDER BY title ASC
	`

	rows, err := r.db.Pool.Query(ctx, query, sectionID)
	if err != nil {
		return nil, fmt.Errorf("list coverage items: %w", err)
	}
	defer rows.Close()

	items := make([]domain.CoverageItem, 0, 8)
	for rows.Next() {
		var item domain.CoverageItem
		if err := rows.Scan(&item.ID, &item.Title, &item.Status, &item.LinkedComponents); err != nil {
			return nil, fmt.Errorf("scan coverage item: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate coverage items: %w", err)
	}

	return items, nil
}
