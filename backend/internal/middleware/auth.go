package middleware

import (
	"context"
	"net/http"
	"strings"

	"sdd-navigator/backend/internal/apperror"
	"sdd-navigator/backend/internal/httputil"
	"sdd-navigator/backend/internal/service"
)

type contextKey string

const userIDKey contextKey = "user_id"

// UserIDFromContext returns the authenticated user id when present.
func UserIDFromContext(ctx context.Context) string {
	v, _ := ctx.Value(userIDKey).(string)
	return v
}

func withUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// JWTAuth validates Bearer access tokens for protected routes.
func JWTAuth(authService *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" {
				httputil.WriteError(w, apperror.Unauthorized("missing authorization header"))
				return
			}

			parts := strings.SplitN(header, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				httputil.WriteError(w, apperror.Unauthorized("invalid authorization header"))
				return
			}

			userID, err := authService.ValidateAccessToken(r.Context(), parts[1])
			if err != nil {
				httputil.WriteError(w, apperror.From(err))
				return
			}

			next.ServeHTTP(w, r.WithContext(withUserID(r.Context(), userID)))
		})
	}
}
