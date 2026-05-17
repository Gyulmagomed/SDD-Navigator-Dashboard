package service

import "context"

// TokenValidator validates bearer access tokens.
type TokenValidator interface {
	ValidateAccessToken(ctx context.Context, token string) (string, error)
}
