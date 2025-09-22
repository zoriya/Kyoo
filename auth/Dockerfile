FROM golang:1.25 AS build
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /keibi

FROM gcr.io/distroless/base-debian11
WORKDIR /app
EXPOSE 4568
USER nonroot:nonroot

COPY --from=build /keibi /app/keibi
COPY sql ./sql

CMD ["/app/keibi"]
