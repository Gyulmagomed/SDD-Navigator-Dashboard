package service_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"sdd-navigator/backend/internal/domain"
	"sdd-navigator/backend/internal/mocks"
	"sdd-navigator/backend/internal/service"
)

func TestSpecificationService_ListDefaultsPagination(t *testing.T) {
	repo := &mocks.SpecificationRepository{
		ListFn: func(ctx context.Context, filter domain.SpecificationFilter) ([]domain.Specification, int, error) {
			assert.Equal(t, 1, filter.Page)
			assert.Equal(t, 20, filter.PageSize)
			return []domain.Specification{{ID: "spec-1"}}, 1, nil
		},
	}

	svc := service.NewSpecificationService(repo)
	specs, total, err := svc.List(context.Background(), domain.SpecificationFilter{})
	require.NoError(t, err)
	assert.Equal(t, 1, total)
	assert.Len(t, specs, 1)
}

func TestSpecificationService_ListCapsPageSize(t *testing.T) {
	repo := &mocks.SpecificationRepository{
		ListFn: func(ctx context.Context, filter domain.SpecificationFilter) ([]domain.Specification, int, error) {
			assert.Equal(t, 100, filter.PageSize)
			return nil, 0, nil
		},
	}

	svc := service.NewSpecificationService(repo)
	_, _, err := svc.List(context.Background(), domain.SpecificationFilter{PageSize: 500})
	require.NoError(t, err)
}
