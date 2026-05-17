package middleware

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"sdd-navigator/backend/internal/metrics"
)

type metricsResponseWriter struct {
	http.ResponseWriter
	status int
}

func (w *metricsResponseWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

// Metrics records Prometheus HTTP metrics.
func Metrics(reg *metrics.Registry) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			wrapped := &metricsResponseWriter{ResponseWriter: w}
			next.ServeHTTP(wrapped, r)

			status := wrapped.status
			if status == 0 {
				status = http.StatusOK
			}

			path := r.URL.Path
			if rc := chi.RouteContext(r.Context()); rc != nil && rc.RoutePattern() != "" {
				path = rc.RoutePattern()
			}

			reg.ObserveHTTP(r.Method, path, status, time.Since(start))
		})
	}
}
