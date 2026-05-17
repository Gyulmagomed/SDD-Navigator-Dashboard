package httputil

import (
	"encoding/json"
	"net/http"

	"sdd-navigator/backend/internal/apperror"
	"sdd-navigator/backend/internal/domain"
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    string `json:"code,omitempty"`
}

type APIResponse[T any] struct {
	Data  T                     `json:"data"`
	Meta  domain.PaginationMeta `json:"meta"`
	Error *APIErrorPayload      `json:"error,omitempty"`
}

type APIErrorPayload struct {
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

func WriteJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func WriteError(w http.ResponseWriter, err error) {
	appErr := apperror.From(err)
	WriteJSON(w, appErr.Status, ErrorResponse{
		Error:   appErr.Message,
		Message: appErr.Message,
		Code:    appErr.Code,
	})
}

func WriteData[T any](w http.ResponseWriter, status int, data T, meta domain.PaginationMeta) {
	WriteJSON(w, status, APIResponse[T]{
		Data: data,
		Meta: meta,
	})
}

func NewMeta(page, pageSize, total int) domain.PaginationMeta {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	totalPages := 1
	if total > 0 {
		totalPages = (total + pageSize - 1) / pageSize
	}
	return domain.PaginationMeta{
		Page:       page,
		PageSize:   pageSize,
		Total:      total,
		TotalPages: totalPages,
	}
}
