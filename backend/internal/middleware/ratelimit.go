package middleware

import (
	"net/http"
	"sync"

	"golang.org/x/time/rate"

	"sdd-navigator/backend/internal/apperror"
	"sdd-navigator/backend/internal/httputil"
)

// RateLimit applies a per-client-IP token bucket limiter.
func RateLimit(rps float64, burst int) func(http.Handler) http.Handler {
	if rps <= 0 {
		return func(next http.Handler) http.Handler { return next }
	}

	var (
		mu       sync.Mutex
		limiters = make(map[string]*rate.Limiter)
	)

	getLimiter := func(ip string) *rate.Limiter {
		mu.Lock()
		defer mu.Unlock()

		lim, ok := limiters[ip]
		if !ok {
			lim = rate.NewLimiter(rate.Limit(rps), burst)
			limiters[ip] = lim
		}
		return lim
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !getLimiter(clientIP(r)).Allow() {
				httputil.WriteError(w, apperror.TooManyRequests("too many requests"))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
