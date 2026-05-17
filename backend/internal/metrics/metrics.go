package metrics

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Registry wraps Prometheus collectors used by the API.
type Registry struct {
	HTTPRequestsTotal   *prometheus.CounterVec
	HTTPRequestDuration *prometheus.HistogramVec
	HTTPErrorsTotal     *prometheus.CounterVec
	DBQueryDuration     *prometheus.HistogramVec
}

func NewRegistry() *Registry {
	r := &Registry{
		HTTPRequestsTotal: prometheus.NewCounterVec(prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		}, []string{"method", "path", "status"}),
		HTTPRequestDuration: prometheus.NewHistogramVec(prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request duration in seconds",
			Buckets: prometheus.DefBuckets,
		}, []string{"method", "path"}),
		HTTPErrorsTotal: prometheus.NewCounterVec(prometheus.CounterOpts{
			Name: "http_errors_total",
			Help: "Total number of HTTP error responses (4xx/5xx)",
		}, []string{"method", "path", "status"}),
		DBQueryDuration: prometheus.NewHistogramVec(prometheus.HistogramOpts{
			Name:    "db_query_duration_seconds",
			Help:    "Database query duration in seconds",
			Buckets: prometheus.DefBuckets,
		}, []string{"operation"}),
	}

	prometheus.MustRegister(
		r.HTTPRequestsTotal,
		r.HTTPRequestDuration,
		r.HTTPErrorsTotal,
		r.DBQueryDuration,
	)

	return r
}

func (r *Registry) Handler() http.Handler {
	return promhttp.Handler()
}

func (r *Registry) ObserveHTTP(method, path string, status int, duration time.Duration) {
	statusLabel := strconv.Itoa(status)
	r.HTTPRequestsTotal.WithLabelValues(method, path, statusLabel).Inc()
	r.HTTPRequestDuration.WithLabelValues(method, path).Observe(duration.Seconds())
	if status >= http.StatusBadRequest {
		r.HTTPErrorsTotal.WithLabelValues(method, path, statusLabel).Inc()
	}
}

func (r *Registry) ObserveDB(operation string, duration time.Duration) {
	r.DBQueryDuration.WithLabelValues(operation).Observe(duration.Seconds())
}
