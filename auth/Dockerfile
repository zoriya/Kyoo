FROM golang:1.23 AS build
WORKDIR /app

RUN go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
RUN go install github.com/swaggo/swag/cmd/swag@latest

COPY go.mod go.sum ./
RUN go mod download

COPY sqlc.yaml ./
COPY sql ./sql
RUN sqlc generate

COPY . .
RUN swag init --parseDependency
RUN CGO_ENABLED=0 GOOS=linux go build -o /keibi

FROM gcr.io/distroless/base-debian11
WORKDIR /app
EXPOSE 4568
USER nonroot:nonroot

COPY --from=build /keibi /app/keibi
COPY sql ./sql

CMD ["/app/keibi"]
