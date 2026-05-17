package service

import (
	"context"

	"sdd-navigator/backend/internal/apperror"
	"sdd-navigator/backend/internal/domain"
	"sdd-navigator/backend/internal/repository"
)

type DashboardService struct {
	dashboard repository.DashboardRepository
}

func NewDashboardService(dashboard repository.DashboardRepository) *DashboardService {
	return &DashboardService{dashboard: dashboard}
}

func (s *DashboardService) GetStats(ctx context.Context) (domain.DashboardStats, error) {
	stats, err := s.dashboard.GetStats(ctx)
	if err != nil {
		return domain.DashboardStats{}, apperror.Internal(err)
	}
	return stats, nil
}
