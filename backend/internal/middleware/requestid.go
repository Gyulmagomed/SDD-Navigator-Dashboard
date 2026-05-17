package middleware

import (
	"net/http"

	"github.com/google/uuid"

	"sdd-navigator/backend/internal/observability"
)

const RequestIDHeader = "X-Request-ID"

// RequestID assigns a unique request identifier to each HTTP request.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := r.Header.Get(RequestIDHeader)
		if requestID == "" {
			requestID = uuid.NewString()
		}

		ctx := observability.WithRequestID(r.Context(), requestID)
		w.Header().Set(RequestIDHeader, requestID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
