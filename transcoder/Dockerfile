FROM golang:1.21-alpine as build
RUN apk add --no-cache build-base ffmpeg ffmpeg-dev libmediainfo-dev
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o ./transcoder

FROM alpine
RUN apk add --no-cache build-base ffmpeg libmediainfo-dev
WORKDIR /app
COPY --from=build /app/transcoder /app/transcoder

EXPOSE 7666
CMD ./transcoder
