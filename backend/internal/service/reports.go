package service

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"

	"sdd-navigator/backend/internal/apperror"
	"sdd-navigator/backend/internal/repository"
)

type ReportsService struct {
	specs    repository.SpecificationRepository
	coverage repository.CoverageRepository
}

func NewReportsService(
	specs repository.SpecificationRepository,
	coverage repository.CoverageRepository,
) *ReportsService {
	return &ReportsService{specs: specs, coverage: coverage}
}

func (s *ReportsService) Export(ctx context.Context, specID, format string) ([]byte, string, error) {
	spec, err := s.specs.GetByID(ctx, specID)
	if err != nil {
		return nil, "", err
	}

	metrics, err := s.coverage.ListBySpecID(ctx, specID)
	if err != nil {
		return nil, "", apperror.Internal(err)
	}

	switch format {
	case "json":
		payload := map[string]any{
			"specification": spec,
			"coverage":      metrics,
		}
		data, err := json.MarshalIndent(payload, "", "  ")
		if err != nil {
			return nil, "", apperror.Internal(err)
		}
		return data, "application/json", nil

	case "csv":
		var buf bytes.Buffer
		writer := csv.NewWriter(&buf)
		_ = writer.Write([]string{"section", "item", "status", "percent"})
		for _, metric := range metrics {
			for _, item := range metric.Items {
				_ = writer.Write([]string{
					metric.Section,
					item.Title,
					item.Status,
					fmt.Sprintf("%.2f", metric.Percent),
				})
			}
		}
		writer.Flush()
		if err := writer.Error(); err != nil {
			return nil, "", apperror.Internal(err)
		}
		return buf.Bytes(), "text/csv", nil

	case "pdf":
		content := fmt.Sprintf("SDD Navigator report\nSpec: %s (%s)\nCoverage sections: %d\n",
			spec.Name, spec.ID, len(metrics))
		return []byte(content), "application/pdf", nil

	default:
		return nil, "", apperror.BadRequest("unsupported export format")
	}
}
