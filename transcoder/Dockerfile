FROM golang:1.20-alpine
RUN apk add --no-cache build-base ffmpeg libmediainfo-dev
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o ./transcoder

EXPOSE 7666
CMD ./transcoder
