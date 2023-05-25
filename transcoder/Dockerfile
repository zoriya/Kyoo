FROM rust as builder
WORKDIR /app

# FIX: see https://github.com/rust-lang/cargo/issues/2644
RUN mkdir src/ && touch src/lib.rs
COPY Cargo.toml Cargo.lock ./
RUN cargo build
RUN rm src/lib.rs

COPY src src
RUN cargo install --path .

FROM alpine
RUN apk add --no-cache ffmpeg mediainfo
COPY --from=builder /usr/local/cargo/bin/transcoder ./transcoder

EXPOSE 7666
CMD ./transcoder
