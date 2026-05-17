// @title SDD Navigator API
// @version 1.0
// @description REST API for the SDD Navigator dashboard.
// @host localhost:4000
// @BasePath /
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
package main

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
	"sdd-navigator/backend/internal/middleware"
	"sdd-navigator/backend/internal/observability"
	"sdd-navigator/backend/internal/platform/logger"
	"sdd-navigator/backend/internal/repository/postgres"
	"sdd-navigator/backend/internal/service"
)

func main() {
	if err := run(); err != nil {
		slog.Error("application stopped with error", slog.String("error", err.Error()))
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	log := logger.New(cfg.LogLevel, cfg.AppEnv)
	slog.SetDefault(log)

	shutdownOTel, err := observability.InitOpenTelemetry(context.Background(), cfg.OTelServiceName, cfg.OTelEnabled)
	if err != nil {
		return fmt.Errorf("init opentelemetry: %w", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	db, err := postgres.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer db.Close()

	if err := postgres.RunMigrations(ctx, db); err != nil {
		return fmt.Errorf("run migrations: %w", err)
	}
	if err := db.EnsureDemoUser(ctx, cfg.DemoUserEmail, cfg.DemoUserPassword, "Test User"); err != nil {
		return fmt.Errorf("seed demo user: %w", err)
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

	router := handler.NewRouter(handler.Dependencies{
		Auth:           authService,
		Specifications: specService,
		Dashboard:      dashboardService,
		Coverage:       coverageService,
		Reports:        reportsService,
		Tracer:         tracer,
		Logger:         log,
		AllowedOrigins: cfg.CORSAllowedOrigins,
		RequestLogger:  middleware.Logging(log),
	})

	server := &http.Server{
		Addr:              fmt.Sprintf("%s:%s", cfg.HTTPHost, cfg.HTTPPort),
		Handler:           router,
		ReadTimeout:       cfg.HTTPReadTimeout,
		WriteTimeout:      cfg.HTTPWriteTimeout,
		IdleTimeout:       cfg.HTTPIdleTimeout,
		ReadHeaderTimeout: cfg.HTTPReadTimeout,
	}

	errCh := make(chan error, 1)
	go func() {
		log.Info("http server starting", slog.String("addr", server.Addr))
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-sigCh:
		log.Info("shutdown signal received", slog.String("signal", sig.String()))
	case err := <-errCh:
		return err
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("shutdown http server: %w", err)
	}

	if err := shutdownOTel(shutdownCtx); err != nil {
		return fmt.Errorf("shutdown opentelemetry: %w", err)
	}

	log.Info("shutdown complete")
	return nil
}
