FROM golang:1.21 as build
RUN apt-get update \
	&& apt-get install --no-install-recommends --no-install-suggests -y \
	ffmpeg libavformat-dev libavutil-dev libswscale-dev libmediainfo-dev \
	&& apt-get autoremove -y
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o ./transcoder

# debian is required for nvidia hardware acceleration
FROM debian:12-slim
RUN apt-get update \
	&& apt-get install --no-install-recommends --no-install-suggests -y ffmpeg libmediainfo-dev \
	&& apt-get autoremove -y

WORKDIR /app
COPY --from=build /app/transcoder /app/transcoder

# flags for nvidia acceleration on docker < 25.0
ENV NVIDIA_VISIBLE_DEVICES="all"
ENV NVIDIA_DRIVER_CAPABILITIES="all"

EXPOSE 7666
CMD ./transcoder
