package postgres

import "testing"

func TestResolveSpecSortColumn_Whitelist(t *testing.T) {
	t.Parallel()

	if got := resolveSpecSortColumn("name"); got != "name" {
		t.Fatalf("expected name, got %s", got)
	}
	if got := resolveSpecSortColumn("'; DROP TABLE specifications; --"); got != "last_updated" {
		t.Fatalf("unexpected column: %s", got)
	}
}
