package handler

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	httpSwagger "github.com/swaggo/http-swagger/v2"

	"sdd-navigator/backend/internal/metrics"
	"sdd-navigator/backend/internal/middleware"
	"sdd-navigator/backend/internal/observability"
	"sdd-navigator/backend/internal/service"

	_ "sdd-navigator/backend/docs"
)

type Dependencies struct {
	Auth            *service.AuthService
	Specifications  *service.SpecificationService
	Dashboard       *service.DashboardService
	Coverage        *service.CoverageService
	Reports         *service.ReportsService
	Tracer          *observability.Tracer
	Logger          *slog.Logger
	Metrics         *metrics.Registry
	AllowedOrigins  []string
	OTelEnabled     bool
	OTelServiceName string
	RateLimitRPS    float64
	RateLimitBurst  int
	RequestLogger   func(http.Handler) http.Handler
}

func NewRouter(deps Dependencies) http.Handler {
	r := chi.NewRouter()

	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.NoCache)
	r.Use(middleware.RequestID)
	r.Use(middleware.OpenTelemetry(deps.OTelEnabled, deps.OTelServiceName))
	if deps.Metrics != nil {
		r.Use(middleware.Metrics(deps.Metrics))
	}
	r.Use(middleware.Tracing(deps.Tracer))
	if deps.RequestLogger != nil {
		r.Use(deps.RequestLogger)
	}
	r.Use(middleware.Recovery(deps.Logger))
	r.Use(middleware.CORS(deps.AllowedOrigins))

	health := NewHealthHandler()
	auth := NewAuthHandler(deps.Auth)
	specs := NewSpecificationHandler(deps.Specifications)
	dashboard := NewDashboardHandler(deps.Dashboard)
	coverage := NewCoverageHandler(deps.Coverage)
	reports := NewReportsHandler(deps.Reports)

	r.Get("/health", health.Health)
	if deps.Metrics != nil {
		r.Handle("/metrics", deps.Metrics.Handler())
	}
	r.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"),
	))

	r.Route("/auth", func(authRouter chi.Router) {
		authRouter.Use(middleware.RateLimit(deps.RateLimitRPS, deps.RateLimitBurst))
		authRouter.Post("/login", auth.Login)
		authRouter.Post("/refresh", auth.Refresh)
	})

	r.Group(func(protected chi.Router) {
		protected.Use(middleware.JWTAuth(deps.Auth))
		protected.Get("/dashboard/stats", dashboard.GetStats)
		protected.Get("/specifications", specs.List)
		protected.Get("/specifications/{id}", specs.GetByID)
		protected.Get("/coverage/{specId}", coverage.GetBySpecID)
		protected.Get("/reports/export/{specId}", reports.Export)
	})

	return r
}
