package middleware

import (
	"log/slog"
	"net/http"

	"sdd-navigator/backend/internal/observability"
)

// Tracing records request lifecycle spans and prepares context for OpenTelemetry.
func Tracing(tracer *observability.Tracer) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, span := tracer.Start(r.Context(), "http.request",
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
			)

			next.ServeHTTP(w, r.WithContext(ctx))
			span.End(ctx, nil)
		})
	}
}
