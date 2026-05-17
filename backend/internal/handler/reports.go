package handler

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"

	"sdd-navigator/backend/internal/apperror"
	"sdd-navigator/backend/internal/service"
)

type ReportsHandler struct {
	reports *service.ReportsService
}

func NewReportsHandler(reports *service.ReportsService) *ReportsHandler {
	return &ReportsHandler{reports: reports}
}

// Export godoc
// @Summary Export specification report
// @Tags reports
// @Produce json
// @Security BearerAuth
// @Param specId path string true "Specification ID"
// @Param format query string true "Export format" Enums(pdf, csv, json)
// @Success 200 {file} file
// @Failure 400 {object} errorResponse
// @Router /reports/export/{specId} [get]
func (h *ReportsHandler) Export(w http.ResponseWriter, r *http.Request) {
	specID := chi.URLParam(r, "specId")
	format := r.URL.Query().Get("format")
	if format == "" {
		WriteError(w, apperror.BadRequest("format query parameter is required"))
		return
	}

	data, contentType, err := h.reports.Export(r.Context(), specID, format)
	if err != nil {
		WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"report-%s.%s\"", specID, format))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}
