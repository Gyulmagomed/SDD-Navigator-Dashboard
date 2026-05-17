.PHONY: run build test test-integration lint swagger tidy docker-up

run:
	go run ./cmd/api

build:
	go build -o bin/api ./cmd/api

test:
	go test -race -coverprofile=coverage.out ./...

test-integration:
	go test -race -tags=integration -count=1 ./tests/integration/...

lint:
	golangci-lint run ./...

docker-up:
	docker compose up --build

swagger:
	go run github.com/swaggo/swag/cmd/swag@v1.16.4 init -g cmd/api/main.go -o docs --parseDependency --parseInternal

tidy:
	go mod tidy
