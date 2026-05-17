package postgres

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// EnsureDemoUser creates the demo credentials used by the dashboard when missing.
func (db *DB) EnsureDemoUser(ctx context.Context, email, password, name string) error {
	var exists bool
	if err := db.Pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, email).Scan(&exists); err != nil {
		return fmt.Errorf("check demo user: %w", err)
	}
	if exists {
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash demo password: %w", err)
	}

	_, err = db.Pool.Exec(ctx, `
		INSERT INTO users (id, email, name, password_hash)
		VALUES ($1, $2, $3, $4)
	`, uuid.NewString(), email, name, string(hash))
	if err != nil {
		return fmt.Errorf("insert demo user: %w", err)
	}

	return nil
}
