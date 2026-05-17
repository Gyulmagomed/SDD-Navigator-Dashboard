package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"sdd-navigator/backend/internal/service"
)

type CoverageHandler struct {
	coverage *service.CoverageService
}

func NewCoverageHandler(coverage *service.CoverageService) *CoverageHandler {
	return &CoverageHandler{coverage: coverage}
}

// GetBySpecID godoc
// @Summary Coverage metrics by specification
// @Tags coverage
// @Produce json
// @Security BearerAuth
// @Param specId path string true "Specification ID"
// @Success 200 {object} apiResponse[[]domain.CoverageMetric]
// @Failure 404 {object} errorResponse
// @Router /coverage/{specId} [get]
func (h *CoverageHandler) GetBySpecID(w http.ResponseWriter, r *http.Request) {
	specID := chi.URLParam(r, "specId")
	metrics, err := h.coverage.GetBySpecID(r.Context(), specID)
	if err != nil {
		WriteError(w, err)
		return
	}

	WriteData(w, http.StatusOK, metrics, NewMeta(1, len(metrics), len(metrics)))
}
