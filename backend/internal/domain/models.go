package domain

import "time"

type User struct {
	ID           string
	Email        string
	Name         string
	PasswordHash string
}

type Specification struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	Version         string    `json:"version"`
	Status          string    `json:"status"`
	TotalItems      int       `json:"totalItems"`
	CoveredItems    int       `json:"coveredItems"`
	CoveragePercent float64   `json:"coveragePercent"`
	LastUpdated     time.Time `json:"lastUpdated"`
	Owner           string    `json:"owner"`
}

type CoverageItem struct {
	ID               string   `json:"id"`
	Title            string   `json:"title"`
	Status           string   `json:"status"`
	LinkedComponents []string `json:"linkedComponents"`
}

type CoverageMetric struct {
	SpecID  string         `json:"specId"`
	Section string         `json:"section"`
	Items   []CoverageItem `json:"items"`
	Percent float64        `json:"percent"`
}

type TrendPoint struct {
	Date     string  `json:"date"`
	Coverage float64 `json:"coverage"`
}

type DashboardStats struct {
	TotalSpecs              int          `json:"totalSpecs"`
	AvgCoverage             float64      `json:"avgCoverage"`
	CriticalGaps            int          `json:"criticalGaps"`
	Trend                   []TrendPoint `json:"trend"`
	TotalSpecsDeltaLastWeek *int         `json:"totalSpecsDeltaLastWeek,omitempty"`
	FullyCoveredSpecs       *int         `json:"fullyCoveredSpecs,omitempty"`
}

type PaginationMeta struct {
	Page       int `json:"page"`
	PageSize   int `json:"pageSize"`
	Total      int `json:"total"`
	TotalPages int `json:"totalPages"`
}

type SpecificationFilter struct {
	Status    string
	Owner     string
	DateFrom  *time.Time
	DateTo    *time.Time
	Search    string
	SortBy    string
	SortOrder string
	Page      int
	PageSize  int
}

type LoginResult struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    int64
	User         UserPublic
}

type UserPublic struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

type TokenPair struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    int64
}
