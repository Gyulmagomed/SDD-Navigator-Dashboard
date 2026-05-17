package testutil

import (
	"net/http"
	"testing"

	"sdd-navigator/backend/internal/handler"
	"sdd-navigator/backend/internal/mocks"
	"sdd-navigator/backend/internal/observability"
	"sdd-navigator/backend/internal/service"
)

func NewTestRouter(t *testing.T, auth *service.AuthService) http.Handler {
	t.Helper()

	specRepo := &mocks.SpecificationRepository{}
	coverageRepo := &mocks.CoverageRepository{}
	dashboardRepo := &mocks.DashboardRepository{}

	return handler.NewRouter(handler.Dependencies{
		Auth:            auth,
		Specifications:  service.NewSpecificationService(specRepo),
		Dashboard:       service.NewDashboardService(dashboardRepo),
		Coverage:        service.NewCoverageService(coverageRepo, specRepo),
		Reports:         service.NewReportsService(specRepo, coverageRepo),
		Tracer:          observability.NewTracer(DiscardLogger()),
		Logger:          DiscardLogger(),
		AllowedOrigins:  []string{"http://localhost:3000"},
		RateLimitRPS:    1000,
		RateLimitBurst:  1000,
		RequestLogger:   nil,
	})
}
