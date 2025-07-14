FROM oven/bun AS builder
WORKDIR /app

COPY package.json bun.lock .
RUN bun install --production

COPY . .

EXPOSE 8081
CMD ["bun", "dev"]

# TODO: Actually do something there, either nginx or preferably an ssr bun serv
