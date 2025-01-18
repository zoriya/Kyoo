FROM oven/bun AS builder
WORKDIR /app

COPY package.json bun.lock .
RUN bun install --production

COPY src src
COPY drizzle drizzle
COPY tsconfig.json .

ENV NODE_ENV=production
RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	./src/index.ts

FROM gcr.io/distroless/base
WORKDIR /app

COPY --from=builder /app/server server

ENV NODE_ENV=production
EXPOSE 3000
CMD ["./server"]

