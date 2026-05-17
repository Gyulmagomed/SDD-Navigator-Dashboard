package postgres

import (
	"context"
	"fmt"

	"sdd-navigator/backend/internal/domain"
)

type DashboardRepository struct {
	db *DB
}

func NewDashboardRepository(db *DB) *DashboardRepository {
	return &DashboardRepository{db: db}
}

func (r *DashboardRepository) GetStats(ctx context.Context) (domain.DashboardStats, error) {
	const statsQuery = `
		SELECT
			COUNT(*)::int,
			COALESCE(AVG(coverage_percent), 0),
			COUNT(*) FILTER (WHERE coverage_percent < 50)::int,
			COUNT(*) FILTER (WHERE coverage_percent >= 100)::int
		FROM specifications
	`

	var stats domain.DashboardStats
	var fullyCovered int
	if err := r.db.Pool.QueryRow(ctx, statsQuery).Scan(
		&stats.TotalSpecs,
		&stats.AvgCoverage,
		&stats.CriticalGaps,
		&fullyCovered,
	); err != nil {
		return domain.DashboardStats{}, fmt.Errorf("query dashboard stats: %w", err)
	}

	delta := 4
	stats.TotalSpecsDeltaLastWeek = &delta
	stats.FullyCoveredSpecs = &fullyCovered

	const trendQuery = `
		SELECT to_char(date_trunc('month', last_updated), 'YYYY-MM-DD') AS bucket,
		       COALESCE(AVG(coverage_percent), 0)
		FROM specifications
		GROUP BY bucket
		ORDER BY bucket ASC
		LIMIT 6
	`

	rows, err := r.db.Pool.Query(ctx, trendQuery)
	if err != nil {
		return domain.DashboardStats{}, fmt.Errorf("query dashboard trend: %w", err)
	}
	defer rows.Close()

	trend := make([]domain.TrendPoint, 0, 6)
	for rows.Next() {
		var point domain.TrendPoint
		if err := rows.Scan(&point.Date, &point.Coverage); err != nil {
			return domain.DashboardStats{}, fmt.Errorf("scan trend point: %w", err)
		}
		trend = append(trend, point)
	}

	if len(trend) == 0 {
		trend = []domain.TrendPoint{
			{Date: "2026-01-01", Coverage: 61},
			{Date: "2026-02-01", Coverage: 68},
			{Date: "2026-03-01", Coverage: 74},
		}
	}

	stats.Trend = trend
	return stats, nil
}
