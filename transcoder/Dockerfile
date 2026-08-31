FROM ghcr.io/zoriya/ffmpeg:v8.0.4-dev AS build
COPY --from=golang:1.26 /usr/local/go /usr/local/go
ENV PATH="/usr/local/go/bin:${PATH}"

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN GOOS=linux go build -o ./transcoder

FROM ghcr.io/zoriya/ffmpeg:v8.0.4

WORKDIR /app
COPY --from=build /app/transcoder /app/transcoder
COPY ./migrations /app/migrations

# flags for nvidia acceleration on docker < 25.0
ENV NVIDIA_VISIBLE_DEVICES="all"
ENV NVIDIA_DRIVER_CAPABILITIES="all"

EXPOSE 7666
ENTRYPOINT []
CMD ["./transcoder"]
