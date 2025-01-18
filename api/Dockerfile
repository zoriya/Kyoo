FROM oven/bun
WORKDIR /app

COPY package.json .
COPY bun.lock .
RUN bun install --production

COPY src src
COPY tsconfig.json .
COPY drizzle drizzle
COPY drizzle drizzle

ENV NODE_ENV production
EXPOSE 3000
CMD ["bun", "src/index.ts"]
