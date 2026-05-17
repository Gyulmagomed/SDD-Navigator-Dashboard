package service_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"sdd-navigator/backend/internal/apperror"
	"sdd-navigator/backend/internal/testutil"
)

func TestAuthService_LoginSuccess(t *testing.T) {
	auth, _ := testutil.NewAuthServiceWithUser(t, "user@example.com", "secret123")

	result, err := auth.Login(context.Background(), "user@example.com", "secret123")
	require.NoError(t, err)
	assert.NotEmpty(t, result.AccessToken)
	assert.NotEmpty(t, result.RefreshToken)
	assert.Equal(t, "user@example.com", result.User.Email)
}

func TestAuthService_LoginInvalidPassword(t *testing.T) {
	auth, _ := testutil.NewAuthServiceWithUser(t, "user@example.com", "secret123")

	_, err := auth.Login(context.Background(), "user@example.com", "wrong")
	require.Error(t, err)
	assert.Equal(t, 401, apperror.From(err).Status)
}

func TestAuthService_LoginUnknownUser(t *testing.T) {
	auth, _ := testutil.NewAuthServiceWithUser(t, "user@example.com", "secret123")

	_, err := auth.Login(context.Background(), "missing@example.com", "secret123")
	require.Error(t, err)
	assert.Equal(t, 401, apperror.From(err).Status)
}

func TestAuthService_RefreshAndValidate(t *testing.T) {
	auth, user := testutil.NewAuthServiceWithUser(t, "user@example.com", "secret123")

	login, err := auth.Login(context.Background(), "user@example.com", "secret123")
	require.NoError(t, err)

	pair, err := auth.Refresh(context.Background(), login.RefreshToken)
	require.NoError(t, err)
	assert.NotEmpty(t, pair.AccessToken)

	userID, err := auth.ValidateAccessToken(context.Background(), pair.AccessToken)
	require.NoError(t, err)
	assert.Equal(t, user.ID, userID)
}

func TestAuthService_ValidateInvalidToken(t *testing.T) {
	auth, _ := testutil.NewAuthServiceWithUser(t, "user@example.com", "secret123")

	_, err := auth.ValidateAccessToken(context.Background(), "not-a-jwt")
	require.Error(t, err)
	assert.Equal(t, 401, apperror.From(err).Status)
}
