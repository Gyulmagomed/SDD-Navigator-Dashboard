package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"sdd-navigator/backend/internal/testutil"
)

func TestAuthHandler_LoginSuccess(t *testing.T) {
	auth, _ := testutil.NewAuthServiceWithUser(t, "user@example.com", "secret123")
	router := testutil.NewTestRouter(t, auth)

	body, _ := json.Marshal(map[string]string{
		"email":    "user@example.com",
		"password": "secret123",
	})
	req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "accessToken")
}

func TestAuthHandler_LoginInvalidBody(t *testing.T) {
	auth, _ := testutil.NewAuthServiceWithUser(t, "user@example.com", "secret123")
	router := testutil.NewTestRouter(t, auth)

	req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewBufferString("{"))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestAuthHandler_ProtectedRouteRequiresToken(t *testing.T) {
	auth, _ := testutil.NewAuthServiceWithUser(t, "user@example.com", "secret123")
	router := testutil.NewTestRouter(t, auth)

	req := httptest.NewRequest(http.MethodGet, "/dashboard/stats", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestAuthHandler_ProtectedRouteWithToken(t *testing.T) {
	auth, _ := testutil.NewAuthServiceWithUser(t, "user@example.com", "secret123")
	router := testutil.NewTestRouter(t, auth)

	loginBody, _ := json.Marshal(map[string]string{
		"email":    "user@example.com",
		"password": "secret123",
	})
	loginReq := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(loginBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRec := httptest.NewRecorder()
	router.ServeHTTP(loginRec, loginReq)
	require.Equal(t, http.StatusOK, loginRec.Code)

	var loginResp struct {
		AccessToken string `json:"accessToken"`
	}
	require.NoError(t, json.Unmarshal(loginRec.Body.Bytes(), &loginResp))

	req := httptest.NewRequest(http.MethodGet, "/dashboard/stats", nil)
	req.Header.Set("Authorization", "Bearer "+loginResp.AccessToken)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
}
