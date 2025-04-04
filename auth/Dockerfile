FROM golang:1.24 AS build
WORKDIR /app

RUN go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
RUN go install github.com/swaggo/swag/cmd/swag@latest

COPY go.mod go.sum ./
RUN go mod download

COPY sqlc.yaml ./
COPY sql ./sql
RUN sqlc generate

COPY . .
RUN swag init --parseDependency --outputTypes json,go
RUN CGO_ENABLED=0 GOOS=linux go build -o /keibi

FROM gcr.io/distroless/base-debian11
WORKDIR /app
EXPOSE 4568
USER nonroot:nonroot

COPY --from=build /keibi /app/keibi
COPY sql ./sql

HEALTHCHECK --interval=30s --retries=15 CMD curl --fail http://localhost:4568$KEIBI_PREFIX/health || exit
CMD ["/app/keibi"]
