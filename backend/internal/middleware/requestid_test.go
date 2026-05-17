package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"sdd-navigator/backend/internal/middleware"
	"sdd-navigator/backend/internal/observability"
)

func TestRequestID_GeneratedAndPropagated(t *testing.T) {
	var captured string
	handler := middleware.RequestID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		captured = observability.RequestIDFromContext(r.Context())
	}))

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	require.NotEmpty(t, captured)
	assert.Equal(t, captured, rec.Header().Get(middleware.RequestIDHeader))
}

func TestRequestID_RespectsIncomingHeader(t *testing.T) {
	const incoming = "fixed-request-id"
	handler := middleware.RequestID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, incoming, observability.RequestIDFromContext(r.Context()))
	}))

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	req.Header.Set(middleware.RequestIDHeader, incoming)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	assert.Equal(t, incoming, rec.Header().Get(middleware.RequestIDHeader))
}
