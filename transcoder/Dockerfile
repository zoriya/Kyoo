FROM golang:1.25 AS build
RUN apt-get update \
	&& apt-get install --no-install-recommends --no-install-suggests -y \
	ffmpeg libavformat-dev libavutil-dev libswscale-dev \
	&& apt-get clean autoclean -y \
	&& apt-get autoremove -y

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN GOOS=linux go build -o ./transcoder

# https://packages.debian.org/trixie/ffmpeg for version tracking
FROM debian:trixie

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
	# Install QSV packages required by ffmpeg here: https://trac.ffmpeg.org/wiki/Hardware/QuickSync
	# libvpl2 is required for newer Intel iGPUs, such as those on Raptor Lake
	$([ " $TARGETARCH" = " amd64" ] && echo "intel-media-va-driver-non-free i965-va-driver-shaders libmfx-gen1.2 libvpl2 libigfxcmrt7") \
	# CA certificates for HTTPS to S3 buckets
	ca-certificates \
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
