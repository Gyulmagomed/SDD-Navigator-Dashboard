package middleware

import (
	"context"
	"net/http"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel/trace"
)

// OpenTelemetry wraps handlers with otelhttp when tracing is enabled.
func OpenTelemetry(enabled bool, serviceName string) func(http.Handler) http.Handler {
	if !enabled {
		return func(next http.Handler) http.Handler { return next }
	}

	return func(next http.Handler) http.Handler {
		return otelhttp.NewHandler(next, serviceName,
			otelhttp.WithSpanNameFormatter(func(_ string, r *http.Request) string {
				return r.Method + " " + r.URL.Path
			}),
		)
	}
}

// TraceIDFromRequest returns OpenTelemetry trace id when present.
func TraceIDFromRequest(ctx context.Context) string {
	span := trace.SpanFromContext(ctx)
	if sc := span.SpanContext(); sc.HasTraceID() {
		return sc.TraceID().String()
	}
	return ""
}
