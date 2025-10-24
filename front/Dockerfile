FROM oven/bun AS builder
WORKDIR /app

COPY package.json bun.lock scripts .
COPY scripts scripts
RUN bun install --production --frozen-lockfile

COPY . .

EXPOSE 8081
CMD ["bun", "dev"]

# TODO: Actually do something there, either nginx or preferably an ssr bun serv
