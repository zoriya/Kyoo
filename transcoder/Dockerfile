# FROM golang:1.23 as build
FROM debian:trixie-slim AS build
# those were copied from https://github.com/docker-library/golang/blob/master/Dockerfile-linux.template
ENV GOTOOLCHAIN=local
ENV GOPATH=/go
ENV PATH=$GOPATH/bin:/usr/local/go/bin:$PATH
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
	ffmpeg libavformat-dev libavutil-dev libswscale-dev \
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

# read target arch from buildx or default to amd64 if using legacy builder.
ARG TARGETARCH
ENV TARGETARCH=${TARGETARCH:-amd64}
RUN echo $TARGETARCH
RUN sed -i -e's/ main/ main contrib non-free/g' /etc/apt/sources.list.d/debian.sources
RUN set -x && apt-get update \
	&& apt-get install --no-install-recommends --no-install-suggests -y \
	# runtime dependencies
	ffmpeg \
	# hwaccel dependencies
	vainfo mesa-va-drivers \
	# intel hwaccel dependencies, not available everywhere
	$([ " $TARGETARCH" = " amd64" ] && echo "intel-media-va-driver-non-free i965-va-driver-shaders") \
	&& apt-get clean autoclean -y \
	&& apt-get autoremove -y \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/transcoder /app/transcoder
COPY ./migrations /app/migrations

# flags for nvidia acceleration on docker < 25.0
ENV NVIDIA_VISIBLE_DEVICES="all"
ENV NVIDIA_DRIVER_CAPABILITIES="all"

EXPOSE 7666
CMD ["./transcoder"]
