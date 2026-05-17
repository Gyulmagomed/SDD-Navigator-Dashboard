package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config holds application configuration loaded from environment variables.
type Config struct {
	AppEnv             string
	HTTPHost           string
	HTTPPort           string
	HTTPReadTimeout    time.Duration
	HTTPWriteTimeout   time.Duration
	HTTPIdleTimeout    time.Duration
	ShutdownTimeout    time.Duration
	DatabaseURL        string
	DBMaxConns         int32
	DBMinConns         int32
	DBQueryTimeout     time.Duration
	JWTSecret          string
	JWTAccessTTL       time.Duration
	JWTRefreshTTL      time.Duration
	CORSAllowedOrigins []string
	LogLevel           string
	OTelServiceName    string
	OTelEnabled        bool
	OTelOTLPEndpoint   string
	MetricsEnabled     bool
	RateLimitRPS       float64
	RateLimitBurst     int
	DemoUserEmail      string
	DemoUserPassword   string
}

// Load reads environment variables and validates required fields.
func Load() (Config, error) {
	_ = godotenv.Load()

	cfg := Config{
		AppEnv:             getEnv("APP_ENV", "development"),
		HTTPHost:           getEnv("HTTP_HOST", "0.0.0.0"),
		HTTPPort:           getEnv("HTTP_PORT", "4000"),
		HTTPReadTimeout:    getDurationEnv("HTTP_READ_TIMEOUT", 15*time.Second),
		HTTPWriteTimeout:   getDurationEnv("HTTP_WRITE_TIMEOUT", 15*time.Second),
		HTTPIdleTimeout:    getDurationEnv("HTTP_IDLE_TIMEOUT", 60*time.Second),
		ShutdownTimeout:    getDurationEnv("SHUTDOWN_TIMEOUT", 10*time.Second),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		DBMaxConns:         int32(getIntEnv("DB_MAX_CONNS", 10)),
		DBMinConns:         int32(getIntEnv("DB_MIN_CONNS", 1)),
		DBQueryTimeout:     getDurationEnv("DB_QUERY_TIMEOUT", 5*time.Second),
		JWTSecret:          os.Getenv("JWT_SECRET"),
		JWTAccessTTL:       getDurationEnv("JWT_ACCESS_TTL", 15*time.Minute),
		JWTRefreshTTL:      getDurationEnv("JWT_REFRESH_TTL", 7*24*time.Hour),
		CORSAllowedOrigins: splitCSV(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")),
		LogLevel:           strings.ToLower(getEnv("LOG_LEVEL", "info")),
		OTelServiceName:    getEnv("OTEL_SERVICE_NAME", "sdd-navigator-api"),
		OTelEnabled:        getBoolEnv("OTEL_ENABLED", false),
		OTelOTLPEndpoint:   getEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:4317"),
		MetricsEnabled:     getBoolEnv("METRICS_ENABLED", true),
		RateLimitRPS:       getFloatEnv("RATE_LIMIT_RPS", 20),
		RateLimitBurst:     getIntEnv("RATE_LIMIT_BURST", 40),
		DemoUserEmail:      getEnv("DEMO_USER_EMAIL", "test@test.com"),
		DemoUserPassword:   getEnv("DEMO_USER_PASSWORD", "123456"),
	}

	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}
	if len(cfg.JWTSecret) < 32 {
		return Config{}, fmt.Errorf("JWT_SECRET must be at least 32 characters")
	}
	if cfg.DBMaxConns < cfg.DBMinConns {
		return Config{}, fmt.Errorf("DB_MAX_CONNS must be >= DB_MIN_CONNS")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getIntEnv(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	var n int
	if _, err := fmt.Sscanf(v, "%d", &n); err != nil {
		return fallback
	}
	return n
}

func getFloatEnv(key string, fallback float64) float64 {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	var n float64
	if _, err := fmt.Sscanf(v, "%f", &n); err != nil {
		return fallback
	}
	return n
}

func getDurationEnv(key string, fallback time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		return fallback
	}
	return d
}

func getBoolEnv(key string, fallback bool) bool {
	v := strings.ToLower(os.Getenv(key))
	if v == "" {
		return fallback
	}
	return v == "1" || v == "true" || v == "yes"
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}
