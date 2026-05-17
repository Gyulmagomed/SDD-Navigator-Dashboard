package app

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"sdd-navigator/backend/internal/config"
	"sdd-navigator/backend/internal/handler"
	"sdd-navigator/backend/internal/metrics"
	"sdd-navigator/backend/internal/middleware"
	"sdd-navigator/backend/internal/observability"
	"sdd-navigator/backend/internal/platform/logger"
	"sdd-navigator/backend/internal/repository/postgres"
	"sdd-navigator/backend/internal/service"
)

// Application wires dependencies and runs the HTTP server.
type Application struct {
	Config   config.Config
	Logger   *slog.Logger
	Metrics  *metrics.Registry
	DB       *postgres.DB
	Handler  http.Handler
	Server   *http.Server
	shutdown []func(context.Context) error
}

// New builds the application graph.
func New(ctx context.Context, cfg config.Config) (*Application, error) {
	log := logger.New(cfg.LogLevel, cfg.AppEnv)
	slog.SetDefault(log)

	var reg *metrics.Registry
	if cfg.MetricsEnabled {
		reg = metrics.NewRegistry()
	}

	shutdownOTel, err := observability.InitOpenTelemetry(ctx, cfg.OTelServiceName, cfg.OTelOTLPEndpoint, cfg.OTelEnabled)
	if err != nil {
		return nil, fmt.Errorf("init opentelemetry: %w", err)
	}

	db, err := postgres.Connect(ctx, cfg, reg)
	if err != nil {
		return nil, err
	}

	if err := postgres.RunMigrations(ctx, db); err != nil {
		db.Close()
		return nil, fmt.Errorf("run migrations: %w", err)
	}
	if err := db.EnsureDemoUser(ctx, cfg.DemoUserEmail, cfg.DemoUserPassword, "Test User"); err != nil {
		db.Close()
		return nil, fmt.Errorf("seed demo user: %w", err)
	}

	userRepo := postgres.NewUserRepository(db)
	specRepo := postgres.NewSpecificationRepository(db)
	coverageRepo := postgres.NewCoverageRepository(db)
	dashboardRepo := postgres.NewDashboardRepository(db)

	authService := service.NewAuthService(userRepo, cfg)
	specService := service.NewSpecificationService(specRepo)
	dashboardService := service.NewDashboardService(dashboardRepo)
	coverageService := service.NewCoverageService(coverageRepo, specRepo)
	reportsService := service.NewReportsService(specRepo, coverageRepo)
	tracer := observability.NewTracer(log)

	httpHandler := handler.NewRouter(handler.Dependencies{
		Auth:            authService,
		Specifications:  specService,
		Dashboard:       dashboardService,
		Coverage:        coverageService,
		Reports:         reportsService,
		Tracer:          tracer,
		Logger:          log,
		Metrics:         reg,
		AllowedOrigins:  cfg.CORSAllowedOrigins,
		OTelEnabled:     cfg.OTelEnabled,
		OTelServiceName: cfg.OTelServiceName,
		RateLimitRPS:    cfg.RateLimitRPS,
		RateLimitBurst:  cfg.RateLimitBurst,
		RequestLogger:   middleware.Logging(log),
	})

	server := &http.Server{
		Addr:              fmt.Sprintf("%s:%s", cfg.HTTPHost, cfg.HTTPPort),
		Handler:           httpHandler,
		ReadTimeout:       cfg.HTTPReadTimeout,
		WriteTimeout:      cfg.HTTPWriteTimeout,
		IdleTimeout:       cfg.HTTPIdleTimeout,
		ReadHeaderTimeout: cfg.HTTPReadTimeout,
	}

	return &Application{
		Config:  cfg,
		Logger:  log,
		Metrics: reg,
		DB:      db,
		Handler: httpHandler,
		Server:  server,
		shutdown: []func(context.Context) error{
			shutdownOTel,
			func(ctx context.Context) error {
				db.Close()
				return nil
			},
		},
	}, nil
}

// Run starts the HTTP server and handles graceful shutdown.
func (a *Application) Run(ctx context.Context) error {
	errCh := make(chan error, 1)
	go func() {
		a.Logger.Info("http server starting", slog.String("addr", a.Server.Addr))
		if err := a.Server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case <-ctx.Done():
		a.Logger.Info("context cancelled, shutting down")
	case sig := <-sigCh:
		a.Logger.Info("shutdown signal received", slog.String("signal", sig.String()))
	case err := <-errCh:
		return err
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), a.Config.ShutdownTimeout)
	defer cancel()

	if err := a.Server.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("shutdown http server: %w", err)
	}

	for _, fn := range a.shutdown {
		if err := fn(shutdownCtx); err != nil {
			return err
		}
	}

	a.Logger.Info("shutdown complete")
	return nil
}
