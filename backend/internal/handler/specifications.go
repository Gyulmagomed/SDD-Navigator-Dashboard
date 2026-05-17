package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"sdd-navigator/backend/internal/domain"
	"sdd-navigator/backend/internal/service"
)

type SpecificationHandler struct {
	specs *service.SpecificationService
}

func NewSpecificationHandler(specs *service.SpecificationService) *SpecificationHandler {
	return &SpecificationHandler{specs: specs}
}

type specificationDTO struct {
	ID              string  `json:"id"`
	Name            string  `json:"name"`
	Version         string  `json:"version"`
	Status          string  `json:"status"`
	TotalItems      int     `json:"totalItems"`
	CoveredItems    int     `json:"coveredItems"`
	CoveragePercent float64 `json:"coveragePercent"`
	LastUpdated     string  `json:"lastUpdated"`
	Owner           string  `json:"owner"`
}

func toSpecificationDTO(spec domain.Specification) specificationDTO {
	return specificationDTO{
		ID:              spec.ID,
		Name:            spec.Name,
		Version:         spec.Version,
		Status:          spec.Status,
		TotalItems:      spec.TotalItems,
		CoveredItems:    spec.CoveredItems,
		CoveragePercent: spec.CoveragePercent,
		LastUpdated:     spec.LastUpdated.UTC().Format(time.RFC3339),
		Owner:           spec.Owner,
	}
}

// List godoc
// @Summary List specifications
// @Tags specifications
// @Produce json
// @Security BearerAuth
// @Param status query string false "Status filter"
// @Param owner query string false "Owner filter"
// @Param search query string false "Search by name or id"
// @Param page query int false "Page number"
// @Param pageSize query int false "Page size"
// @Success 200 {object} apiResponse[[]specificationDTO]
// @Router /specifications [get]
func (h *SpecificationHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	pageSize, _ := strconv.Atoi(q.Get("pageSize"))

	filter := service.ParseSpecificationFilter(
		q.Get("status"),
		q.Get("owner"),
		q.Get("search"),
		q.Get("sortBy"),
		q.Get("sortOrder"),
		q.Get("dateFrom"),
		q.Get("dateTo"),
		page,
		pageSize,
	)

	specs, total, err := h.specs.List(r.Context(), filter)
	if err != nil {
		WriteError(w, err)
		return
	}

	data := make([]specificationDTO, 0, len(specs))
	for _, spec := range specs {
		data = append(data, toSpecificationDTO(spec))
	}

	WriteData(w, http.StatusOK, data, NewMeta(filter.Page, filter.PageSize, total))
}

// GetByID godoc
// @Summary Get specification by id
// @Tags specifications
// @Produce json
// @Security BearerAuth
// @Param id path string true "Specification ID"
// @Success 200 {object} apiResponse[specificationDTO]
// @Failure 404 {object} errorResponse
// @Router /specifications/{id} [get]
func (h *SpecificationHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	spec, err := h.specs.GetByID(r.Context(), id)
	if err != nil {
		WriteError(w, err)
		return
	}

	WriteData(w, http.StatusOK, toSpecificationDTO(spec), NewMeta(1, 1, 1))
}
