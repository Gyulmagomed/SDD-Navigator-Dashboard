package service

import (
	"context"

	"sdd-navigator/backend/internal/apperror"
	"sdd-navigator/backend/internal/domain"
	"sdd-navigator/backend/internal/repository"
)

type CoverageService struct {
	coverage repository.CoverageRepository
	specs    repository.SpecificationRepository
}

func NewCoverageService(coverage repository.CoverageRepository, specs repository.SpecificationRepository) *CoverageService {
	return &CoverageService{coverage: coverage, specs: specs}
}

func (s *CoverageService) GetBySpecID(ctx context.Context, specID string) ([]domain.CoverageMetric, error) {
	if _, err := s.specs.GetByID(ctx, specID); err != nil {
		return nil, err
	}

	metrics, err := s.coverage.ListBySpecID(ctx, specID)
	if err != nil {
		return nil, apperror.Internal(err)
	}

	return metrics, nil
}
