package handler

import (
	"encoding/json"
	"net/http"

	"sdd-navigator/backend/internal/apperror"
	"sdd-navigator/backend/internal/service"
)

type AuthHandler struct {
	auth *service.AuthService
}

func NewAuthHandler(auth *service.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

type loginRequestBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type refreshRequestBody struct {
	RefreshToken string `json:"refreshToken"`
}

// Login godoc
// @Summary Login
// @Tags auth
// @Accept json
// @Produce json
// @Param body body loginRequestBody true "Credentials"
// @Success 200 {object} domain.LoginResult
// @Failure 401 {object} errorResponse
// @Router /auth/login [post]
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var body loginRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		WriteError(w, apperror.BadRequest("invalid request body"))
		return
	}
	if body.Email == "" || body.Password == "" {
		WriteError(w, apperror.BadRequest("email and password are required"))
		return
	}

	result, err := h.auth.Login(r.Context(), body.Email, body.Password)
	if err != nil {
		WriteError(w, err)
		return
	}

	WriteJSON(w, http.StatusOK, result)
}

// Refresh godoc
// @Summary Refresh access token
// @Tags auth
// @Accept json
// @Produce json
// @Param body body refreshRequestBody true "Refresh token"
// @Success 200 {object} domain.TokenPair
// @Failure 401 {object} errorResponse
// @Router /auth/refresh [post]
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var body refreshRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		WriteError(w, apperror.BadRequest("invalid request body"))
		return
	}
	if body.RefreshToken == "" {
		WriteError(w, apperror.BadRequest("refreshToken is required"))
		return
	}

	result, err := h.auth.Refresh(r.Context(), body.RefreshToken)
	if err != nil {
		WriteError(w, err)
		return
	}

	WriteJSON(w, http.StatusOK, result)
}
