package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"

	"sdd-navigator/backend/internal/apperror"
	"sdd-navigator/backend/internal/domain"
)

type UserRepository struct {
	db *DB
}

func NewUserRepository(db *DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (domain.User, error) {
	const query = `
		SELECT id, email, name, password_hash
		FROM users
		WHERE email = $1
	`

	var user domain.User
	err := r.db.Pool.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.PasswordHash,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.User{}, apperror.NotFound("user not found")
	}
	if err != nil {
		return domain.User{}, fmt.Errorf("get user by email: %w", err)
	}

	return user, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (domain.User, error) {
	const query = `
		SELECT id, email, name, password_hash
		FROM users
		WHERE id = $1
	`

	var user domain.User
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.PasswordHash,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.User{}, apperror.NotFound("user not found")
	}
	if err != nil {
		return domain.User{}, fmt.Errorf("get user by id: %w", err)
	}

	return user, nil
}
