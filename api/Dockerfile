FROM oven/bun:debian AS builder
WORKDIR /app

COPY package.json bun.lock .
COPY patches patches
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

FROM debian
WORKDIR /app

COPY --from=builder /app/server server
COPY --from=builder /app/node_modules/@img /app/node_modules/@img
COPY ./drizzle ./drizzle

ENV NODE_ENV=production
EXPOSE 3567
CMD ["/app/server"]
