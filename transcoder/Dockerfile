FROM golang:1.26 AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o ./transcoder

FROM ghcr.io/zoriya/ffmpeg:v8.0.2

WORKDIR /app
COPY --from=build /app/transcoder /app/transcoder
COPY ./migrations /app/migrations

# flags for nvidia acceleration on docker < 25.0
ENV NVIDIA_VISIBLE_DEVICES="all"
ENV NVIDIA_DRIVER_CAPABILITIES="all"

EXPOSE 7666
CMD ["./transcoder"]
