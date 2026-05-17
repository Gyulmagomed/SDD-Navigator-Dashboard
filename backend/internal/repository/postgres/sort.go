package postgres

// allowedSpecSortColumns is a whitelist to prevent SQL injection via sortBy.
var allowedSpecSortColumns = map[string]string{
	"name":            "name",
	"status":          "status",
	"owner":           "owner",
	"coveragePercent": "coverage_percent",
	"lastUpdated":     "last_updated",
	"last_updated":    "last_updated",
	"coverage_percent": "coverage_percent",
}

func resolveSpecSortColumn(sortBy string) string {
	if col, ok := allowedSpecSortColumns[sortBy]; ok {
		return col
	}
	return "last_updated"
}
