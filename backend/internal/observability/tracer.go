package observability

import (
	"context"
	"log/slog"
	"time"

	"github.com/google/uuid"
)

// Span represents a logical unit of work for a request lifecycle.
// The implementation is intentionally lightweight and ready for OpenTelemetry wiring.
type Span struct {
	Name      string
	TraceID   string
	Start     time.Time
	Logger    *slog.Logger
	attrs     []slog.Attr
}

func (s *Span) End(ctx context.Context, err error) {
	duration := time.Since(s.Start)
	attrs := append([]slog.Attr{
		slog.String("span", s.Name),
		slog.String("trace_id", s.TraceID),
		slog.Duration("duration", duration),
	}, s.attrs...)

	if rid := RequestIDFromContext(ctx); rid != "" {
		attrs = append(attrs, slog.String("request_id", rid))
	}

	if err != nil {
		attrs = append(attrs, slog.String("error", err.Error()))
		s.Logger.LogAttrs(ctx, slog.LevelError, "span finished with error", attrs...)
		return
	}

	s.Logger.LogAttrs(ctx, slog.LevelDebug, "span finished", attrs...)
}

// Tracer provides request lifecycle tracing hooks.
type Tracer struct {
	logger *slog.Logger
}

func NewTracer(logger *slog.Logger) *Tracer {
	return &Tracer{logger: logger}
}

func (t *Tracer) Start(ctx context.Context, name string, attrs ...slog.Attr) (context.Context, *Span) {
	traceID := TraceIDFromContext(ctx)
	if traceID == "" {
		traceID = uuid.NewString()
		ctx = WithTraceID(ctx, traceID)
	}

	span := &Span{
		Name:    name,
		TraceID: traceID,
		Start:   time.Now(),
		Logger:  t.logger,
		attrs:   attrs,
	}

	logAttrs := append([]slog.Attr{
		slog.String("span", name),
		slog.String("trace_id", traceID),
	}, attrs...)
	if rid := RequestIDFromContext(ctx); rid != "" {
		logAttrs = append(logAttrs, slog.String("request_id", rid))
	}
	t.logger.LogAttrs(ctx, slog.LevelDebug, "span started", logAttrs...)

	return ctx, span
}
