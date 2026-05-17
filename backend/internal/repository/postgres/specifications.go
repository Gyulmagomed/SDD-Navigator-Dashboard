package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"sdd-navigator/backend/internal/apperror"
	"sdd-navigator/backend/internal/domain"
)

type SpecificationRepository struct {
	db *DB
}

func NewSpecificationRepository(db *DB) *SpecificationRepository {
	return &SpecificationRepository{db: db}
}

func (r *SpecificationRepository) List(ctx context.Context, filter domain.SpecificationFilter) ([]domain.Specification, int, error) {
	start := now()
	ctx, cancel := r.db.withTimeout(ctx)
	defer cancel()

	where := make([]string, 0, 6)
	args := make([]any, 0, 8)
	argPos := 1

	addFilter := func(clause string, value any) {
		where = append(where, fmt.Sprintf(clause, argPos))
		args = append(args, value)
		argPos++
	}

	if filter.Status != "" {
		addFilter("status = $%d", filter.Status)
	}
	if filter.Owner != "" {
		addFilter("owner = $%d", filter.Owner)
	}
	if filter.Search != "" {
		where = append(where, fmt.Sprintf("(name ILIKE $%d OR id ILIKE $%d)", argPos, argPos))
		args = append(args, "%"+filter.Search+"%")
		argPos++
	}
	if filter.DateFrom != nil {
		addFilter("last_updated >= $%d", *filter.DateFrom)
	}
	if filter.DateTo != nil {
		addFilter("last_updated <= $%d", *filter.DateTo)
	}

	whereSQL := ""
	if len(where) > 0 {
		whereSQL = "WHERE " + strings.Join(where, " AND ")
	}

	countQuery := "SELECT COUNT(*) FROM specifications " + whereSQL
	var total int
	if err := r.db.Pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count specifications: %w", err)
	}

	sortBy := resolveSpecSortColumn(filter.SortBy)

	sortOrder := "DESC"
	if strings.EqualFold(filter.SortOrder, "asc") {
		sortOrder = "ASC"
	}

	offset := (filter.Page - 1) * filter.PageSize
	listArgs := append(append([]any{}, args...), filter.PageSize, offset)

	listQuery := fmt.Sprintf(`
		SELECT id, name, version, status, total_items, covered_items, coverage_percent, last_updated, owner
		FROM specifications
		%s
		ORDER BY %s %s
		LIMIT $%d OFFSET $%d
	`, whereSQL, sortBy, sortOrder, argPos, argPos+1)

	rows, err := r.db.Pool.Query(ctx, listQuery, listArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("list specifications: %w", err)
	}
	defer rows.Close()

	specs := make([]domain.Specification, 0, filter.PageSize)
	for rows.Next() {
		spec, err := scanSpecification(rows)
		if err != nil {
			return nil, 0, err
		}
		specs = append(specs, spec)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterate specifications: %w", err)
	}

	r.db.observe("specifications.list", start)
	return specs, total, nil
}

func (r *SpecificationRepository) GetByID(ctx context.Context, id string) (domain.Specification, error) {
	start := now()
	ctx, cancel := r.db.withTimeout(ctx)
	defer cancel()

	const query = `
		SELECT id, name, version, status, total_items, covered_items, coverage_percent, last_updated, owner
		FROM specifications
		WHERE id = $1
	`

	row := r.db.Pool.QueryRow(ctx, query, id)
	spec, err := scanSpecification(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Specification{}, apperror.NotFound("specification not found")
	}
	if err != nil {
		return domain.Specification{}, fmt.Errorf("get specification: %w", err)
	}

	r.db.observe("specifications.get_by_id", start)
	return spec, nil
}

type scannable interface {
	Scan(dest ...any) error
}

func scanSpecification(row scannable) (domain.Specification, error) {
	var spec domain.Specification
	var lastUpdated time.Time

	err := row.Scan(
		&spec.ID,
		&spec.Name,
		&spec.Version,
		&spec.Status,
		&spec.TotalItems,
		&spec.CoveredItems,
		&spec.CoveragePercent,
		&lastUpdated,
		&spec.Owner,
	)
	if err != nil {
		return domain.Specification{}, err
	}

	spec.LastUpdated = lastUpdated
	return spec, nil
}
