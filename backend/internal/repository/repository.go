package repository

import (
	"context"

	"sdd-navigator/backend/internal/domain"
)

// SpecificationRepository handles persistence for specifications.
type SpecificationRepository interface {
	List(ctx context.Context, filter domain.SpecificationFilter) ([]domain.Specification, int, error)
	GetByID(ctx context.Context, id string) (domain.Specification, error)
}

// CoverageRepository handles persistence for coverage metrics.
type CoverageRepository interface {
	ListBySpecID(ctx context.Context, specID string) ([]domain.CoverageMetric, error)
}

// UserRepository handles user lookups for authentication.
type UserRepository interface {
	GetByEmail(ctx context.Context, email string) (domain.User, error)
	GetByID(ctx context.Context, id string) (domain.User, error)
}

// DashboardRepository provides aggregated dashboard queries.
type DashboardRepository interface {
	GetStats(ctx context.Context) (domain.DashboardStats, error)
}
