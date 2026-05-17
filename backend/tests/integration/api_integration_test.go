//go:build integration

package integration_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	postgrescontainer "github.com/testcontainers/testcontainers-go/modules/postgres"

	"sdd-navigator/backend/internal/app"
	"sdd-navigator/backend/internal/config"
)

func TestAPI_LoginAndDashboardFlow(t *testing.T) {
	if os.Getenv("SKIP_INTEGRATION") == "1" {
		t.Skip("integration tests disabled")
	}

	ctx := context.Background()
	pg, err := postgrescontainer.Run(ctx,
		"postgres:16-alpine",
		postgrescontainer.WithDatabase("sdd_test"),
		postgrescontainer.WithUsername("sdd"),
		postgrescontainer.WithPassword("sdd"),
		postgrescontainer.BasicWaitStrategies(),
	)
	require.NoError(t, err)
	t.Cleanup(func() {
		_ = pg.Terminate(ctx)
	})

	connStr, err := pg.ConnectionString(ctx, "sslmode=disable")
	require.NoError(t, err)

	cfg := config.Config{
		AppEnv:           "test",
		HTTPHost:         "127.0.0.1",
		HTTPPort:         "0",
		HTTPReadTimeout:  10 * time.Second,
		HTTPWriteTimeout: 10 * time.Second,
		HTTPIdleTimeout:  30 * time.Second,
		ShutdownTimeout:  5 * time.Second,
		DatabaseURL:      connStr,
		DBMaxConns:       5,
		DBMinConns:       1,
		DBQueryTimeout:   5 * time.Second,
		JWTSecret:        "integration-test-secret-32-characters",
		JWTAccessTTL:     15 * time.Minute,
		JWTRefreshTTL:    24 * time.Hour,
		CORSAllowedOrigins: []string{"http://localhost:3000"},
		LogLevel:         "error",
		MetricsEnabled:   false,
		OTelEnabled:      false,
		RateLimitRPS:     100,
		RateLimitBurst:   100,
		DemoUserEmail:    "integration@test.com",
		DemoUserPassword: "integration123",
	}

	application, err := app.New(ctx, cfg)
	require.NoError(t, err)
	t.Cleanup(application.DB.Close)

	loginBody, _ := json.Marshal(map[string]string{
		"email":    cfg.DemoUserEmail,
		"password": cfg.DemoUserPassword,
	})
	loginReq := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(loginBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRec := httptest.NewRecorder()
	application.Handler.ServeHTTP(loginRec, loginReq)
	require.Equal(t, http.StatusOK, loginRec.Code, loginRec.Body.String())

	var loginResp struct {
		AccessToken string `json:"accessToken"`
	}
	require.NoError(t, json.Unmarshal(loginRec.Body.Bytes(), &loginResp))

	statsReq := httptest.NewRequest(http.MethodGet, "/dashboard/stats", nil)
	statsReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", loginResp.AccessToken))
	statsRec := httptest.NewRecorder()
	application.Handler.ServeHTTP(statsRec, statsReq)

	assert.Equal(t, http.StatusOK, statsRec.Code, statsRec.Body.String())
	assert.Contains(t, statsRec.Body.String(), `"totalSpecs"`)
}
