package handler

import (
	"net/http"

	"sdd-navigator/backend/internal/domain"
	"sdd-navigator/backend/internal/httputil"
)

type errorResponse = httputil.ErrorResponse

func WriteJSON(w http.ResponseWriter, status int, payload any) {
	httputil.WriteJSON(w, status, payload)
}

func WriteError(w http.ResponseWriter, err error) {
	httputil.WriteError(w, err)
}

func WriteData[T any](w http.ResponseWriter, status int, data T, meta domain.PaginationMeta) {
	httputil.WriteData(w, status, data, meta)
}

func NewMeta(page, pageSize, total int) domain.PaginationMeta {
	return httputil.NewMeta(page, pageSize, total)
}
