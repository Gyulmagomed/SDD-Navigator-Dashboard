package mocks

import (
	"context"

	"sdd-navigator/backend/internal/apperror"
	"sdd-navigator/backend/internal/domain"
)

type UserRepository struct {
	UsersByEmail map[string]domain.User
	UsersByID    map[string]domain.User
	GetByEmailFn func(ctx context.Context, email string) (domain.User, error)
	GetByIDFn    func(ctx context.Context, id string) (domain.User, error)
}

func (m *UserRepository) GetByEmail(ctx context.Context, email string) (domain.User, error) {
	if m.GetByEmailFn != nil {
		return m.GetByEmailFn(ctx, email)
	}
	user, ok := m.UsersByEmail[email]
	if !ok {
		return domain.User{}, apperror.NotFound("user not found")
	}
	return user, nil
}

func (m *UserRepository) GetByID(ctx context.Context, id string) (domain.User, error) {
	if m.GetByIDFn != nil {
		return m.GetByIDFn(ctx, id)
	}
	user, ok := m.UsersByID[id]
	if !ok {
		return domain.User{}, apperror.NotFound("user not found")
	}
	return user, nil
}

type SpecificationRepository struct {
	ListFn    func(ctx context.Context, filter domain.SpecificationFilter) ([]domain.Specification, int, error)
	GetByIDFn func(ctx context.Context, id string) (domain.Specification, error)
}

func (m *SpecificationRepository) List(ctx context.Context, filter domain.SpecificationFilter) ([]domain.Specification, int, error) {
	if m.ListFn != nil {
		return m.ListFn(ctx, filter)
	}
	return nil, 0, nil
}

func (m *SpecificationRepository) GetByID(ctx context.Context, id string) (domain.Specification, error) {
	if m.GetByIDFn != nil {
		return m.GetByIDFn(ctx, id)
	}
	return domain.Specification{}, apperror.NotFound("specification not found")
}

type CoverageRepository struct {
	ListBySpecIDFn func(ctx context.Context, specID string) ([]domain.CoverageMetric, error)
}

func (m *CoverageRepository) ListBySpecID(ctx context.Context, specID string) ([]domain.CoverageMetric, error) {
	if m.ListBySpecIDFn != nil {
		return m.ListBySpecIDFn(ctx, specID)
	}
	return nil, nil
}

type DashboardRepository struct {
	GetStatsFn func(ctx context.Context) (domain.DashboardStats, error)
}

func (m *DashboardRepository) GetStats(ctx context.Context) (domain.DashboardStats, error) {
	if m.GetStatsFn != nil {
		return m.GetStatsFn(ctx)
	}
	return domain.DashboardStats{}, nil
}
