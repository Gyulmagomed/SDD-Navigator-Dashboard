package handler

import (
	"net/http"

	"sdd-navigator/backend/internal/service"
)

type DashboardHandler struct {
	dashboard *service.DashboardService
}

func NewDashboardHandler(dashboard *service.DashboardService) *DashboardHandler {
	return &DashboardHandler{dashboard: dashboard}
}

// GetStats godoc
// @Summary Dashboard statistics
// @Tags dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} apiResponse[domain.DashboardStats]
// @Router /dashboard/stats [get]
func (h *DashboardHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.dashboard.GetStats(r.Context())
	if err != nil {
		WriteError(w, err)
		return
	}

	WriteData(w, http.StatusOK, stats, NewMeta(1, 1, 1))
}
