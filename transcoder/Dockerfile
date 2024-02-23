# FROM golang:1.21 as build
FROM debian:trixie-slim as build
# those were copied from https://github.com/docker-library/golang/blob/master/Dockerfile-linux.template
ENV GOTOOLCHAIN=local
ENV GOPATH /go
ENV PATH $GOPATH/bin:/usr/local/go/bin:$PATH
RUN set -eux; \
	apt-get update; \
	apt-get install -y --no-install-recommends \
	ca-certificates openssl \
	golang\
	g++ \
	gcc \
	libc6-dev \
	make \
	pkg-config

# https://github.com/golang/go/issues/54400
ENV SSL_CERT_DIR=/etc/ssl/certs
RUN update-ca-certificates
RUN apt-get update \
	&& apt-get install --no-install-recommends --no-install-suggests -y \
	ffmpeg libavformat-dev libavutil-dev libswscale-dev libmediainfo-dev \
	&& apt-get clean autoclean -y \
	&& apt-get autoremove -y
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o ./transcoder

# debian is required for nvidia hardware acceleration
# we use trixie (debian's testing because ffmpeg on latest is v5 and we need v6)
# https://packages.debian.org/bookworm/ffmpeg for version tracking
FROM debian:trixie-slim
RUN apt-get update \
	&& apt-get install --no-install-recommends --no-install-suggests -y ffmpeg libmediainfo-dev \
	&& apt-get clean autoclean -y \
	&& apt-get autoremove -y \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/transcoder /app/transcoder

# flags for nvidia acceleration on docker < 25.0
ENV NVIDIA_VISIBLE_DEVICES="all"
ENV NVIDIA_DRIVER_CAPABILITIES="all"

EXPOSE 7666
CMD ./transcoder
