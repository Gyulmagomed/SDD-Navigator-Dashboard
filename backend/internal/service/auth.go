package service

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"sdd-navigator/backend/internal/apperror"
	"sdd-navigator/backend/internal/config"
	"sdd-navigator/backend/internal/domain"
	"sdd-navigator/backend/internal/repository"
)

type AuthService struct {
	users      repository.UserRepository
	jwtSecret  []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
}

func NewAuthService(users repository.UserRepository, cfg config.Config) *AuthService {
	return &AuthService{
		users:      users,
		jwtSecret:  []byte(cfg.JWTSecret),
		accessTTL:  cfg.JWTAccessTTL,
		refreshTTL: cfg.JWTRefreshTTL,
	}
}

func (s *AuthService) Login(ctx context.Context, email, password string) (domain.LoginResult, error) {
	user, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		return domain.LoginResult{}, apperror.Unauthorized("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return domain.LoginResult{}, apperror.Unauthorized("invalid credentials")
	}

	pair, err := s.issueTokenPair(user.ID)
	if err != nil {
		return domain.LoginResult{}, err
	}

	return domain.LoginResult{
		AccessToken:  pair.AccessToken,
		RefreshToken: pair.RefreshToken,
		ExpiresIn:    pair.ExpiresIn,
		User: domain.UserPublic{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
		},
	}, nil
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (domain.TokenPair, error) {
	claims, err := s.parseToken(refreshToken, "refresh")
	if err != nil {
		return domain.TokenPair{}, apperror.Unauthorized("invalid refresh token")
	}

	userID, ok := claims["sub"].(string)
	if !ok || userID == "" {
		return domain.TokenPair{}, apperror.Unauthorized("invalid refresh token")
	}

	if _, err := s.users.GetByID(ctx, userID); err != nil {
		return domain.TokenPair{}, apperror.From(err)
	}

	return s.issueTokenPair(userID)
}

func (s *AuthService) ValidateAccessToken(ctx context.Context, token string) (string, error) {
	claims, err := s.parseToken(token, "access")
	if err != nil {
		return "", apperror.Unauthorized("invalid access token")
	}

	userID, ok := claims["sub"].(string)
	if !ok || userID == "" {
		return "", apperror.Unauthorized("invalid access token")
	}

	if _, err := s.users.GetByID(ctx, userID); err != nil {
		return "", apperror.From(err)
	}

	return userID, nil
}

func (s *AuthService) issueTokenPair(userID string) (domain.TokenPair, error) {
	accessToken, err := s.signToken(userID, "access", s.accessTTL)
	if err != nil {
		return domain.TokenPair{}, fmt.Errorf("sign access token: %w", err)
	}

	refreshToken, err := s.signToken(userID, "refresh", s.refreshTTL)
	if err != nil {
		return domain.TokenPair{}, fmt.Errorf("sign refresh token: %w", err)
	}

	return domain.TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.accessTTL.Seconds()),
	}, nil
}

func (s *AuthService) signToken(userID, tokenType string, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"sub":  userID,
		"type": tokenType,
		"iat":  now.Unix(),
		"exp":  now.Add(ttl).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *AuthService) parseToken(tokenString, expectedType string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		return s.jwtSecret, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	if err != nil || !token.Valid {
		return nil, apperror.Unauthorized("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, apperror.Unauthorized("invalid token claims")
	}

	tokenType, _ := claims["type"].(string)
	if tokenType != expectedType {
		return nil, apperror.Unauthorized("invalid token type")
	}

	return claims, nil
}
