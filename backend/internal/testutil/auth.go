package testutil

import (
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"

	"sdd-navigator/backend/internal/config"
	"sdd-navigator/backend/internal/domain"
	"sdd-navigator/backend/internal/mocks"
	"sdd-navigator/backend/internal/service"
)

const TestJWTSecret = "test-jwt-secret-with-32-characters-minimum"

func TestAuthConfig() config.Config {
	return config.Config{
		JWTSecret:     TestJWTSecret,
		JWTAccessTTL:  15 * time.Minute,
		JWTRefreshTTL: 24 * time.Hour,
	}
}

func NewAuthServiceWithUser(t *testing.T, email, password string) (*service.AuthService, domain.User) {
	t.Helper()

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}

	user := domain.User{
		ID:           "user-test-1",
		Email:        email,
		Name:         "Test User",
		PasswordHash: string(hash),
	}

	repo := &mocks.UserRepository{
		UsersByEmail: map[string]domain.User{email: user},
		UsersByID:    map[string]domain.User{user.ID: user},
	}

	return service.NewAuthService(repo, TestAuthConfig()), user
}
