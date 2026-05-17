package service

import (
	"context"
	"time"

	"sdd-navigator/backend/internal/domain"
	"sdd-navigator/backend/internal/repository"
)

type SpecificationService struct {
	specs repository.SpecificationRepository
}

func NewSpecificationService(specs repository.SpecificationRepository) *SpecificationService {
	return &SpecificationService{specs: specs}
}

func (s *SpecificationService) List(ctx context.Context, filter domain.SpecificationFilter) ([]domain.Specification, int, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 20
	}
	if filter.PageSize > 100 {
		filter.PageSize = 100
	}

	return s.specs.List(ctx, filter)
}

func (s *SpecificationService) GetByID(ctx context.Context, id string) (domain.Specification, error) {
	return s.specs.GetByID(ctx, id)
}

func ParseSpecificationFilter(
	status, owner, search, sortBy, sortOrder, dateFrom, dateTo string,
	page, pageSize int,
) domain.SpecificationFilter {
	filter := domain.SpecificationFilter{
		Status:    status,
		Owner:     owner,
		Search:    search,
		SortBy:    sortBy,
		SortOrder: sortOrder,
		Page:      page,
		PageSize:  pageSize,
	}

	if dateFrom != "" {
		if t, err := time.Parse(time.RFC3339, dateFrom); err == nil {
			filter.DateFrom = &t
		}
	}
	if dateTo != "" {
		if t, err := time.Parse(time.RFC3339, dateTo); err == nil {
			filter.DateTo = &t
		}
	}

	return filter
}
