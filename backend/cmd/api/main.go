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
	"log/slog"
	"os"

	"sdd-navigator/backend/internal/app"
	"sdd-navigator/backend/internal/config"
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

	application, err := app.New(context.Background(), cfg)
	if err != nil {
		return err
	}

	return application.Run(context.Background())
}
