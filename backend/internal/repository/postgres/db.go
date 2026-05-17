package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"sdd-navigator/backend/internal/config"
	"sdd-navigator/backend/internal/metrics"
)

// DB wraps a PostgreSQL connection pool.
type DB struct {
	Pool          *pgxpool.Pool
	queryTimeout  time.Duration
	metrics       *metrics.Registry
}

func Connect(ctx context.Context, cfg config.Config, reg *metrics.Registry) (*DB, error) {
	poolCfg, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse database url: %w", err)
	}

	poolCfg.MaxConns = cfg.DBMaxConns
	poolCfg.MinConns = cfg.DBMinConns
	poolCfg.MaxConnLifetime = time.Hour
	poolCfg.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("connect database: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	return &DB{
		Pool:         pool,
		queryTimeout: cfg.DBQueryTimeout,
		metrics:      reg,
	}, nil
}

func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}

func (db *DB) withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	if db.queryTimeout <= 0 {
		return ctx, func() {}
	}
	return context.WithTimeout(ctx, db.queryTimeout)
}

func (db *DB) observe(operation string, start time.Time) {
	if db.metrics != nil {
		db.metrics.ObserveDB(operation, time.Since(start))
	}
}
