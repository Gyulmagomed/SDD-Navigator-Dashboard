package middleware_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"

	"sdd-navigator/backend/internal/middleware"
	"sdd-navigator/backend/internal/testutil"
)

func TestJWTAuth_MissingHeader(t *testing.T) {
	auth, _ := testutil.NewAuthServiceWithUser(t, "user@example.com", "secret123")
	handler := middleware.JWTAuth(auth)(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		t.Fatal("handler should not be called")
	}))

	req := httptest.NewRequest(http.MethodGet, "/dashboard/stats", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestJWTAuth_ValidToken(t *testing.T) {
	auth, _ := testutil.NewAuthServiceWithUser(t, "user@example.com", "secret123")
	login, err := auth.Login(context.Background(), "user@example.com", "secret123")
	if err != nil {
		t.Fatalf("login: %v", err)
	}

	var called bool
	handler := middleware.JWTAuth(auth)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		assert.Equal(t, "user-test-1", middleware.UserIDFromContext(r.Context()))
	}))

	req := httptest.NewRequest(http.MethodGet, "/dashboard/stats", nil)
	req.Header.Set("Authorization", "Bearer "+login.AccessToken)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	assert.True(t, called)
	assert.Equal(t, http.StatusOK, rec.Code)
}
