FROM oven/bun AS builder
WORKDIR /app

# idk why it doesnt' build without it
RUN apt update && apt install -y nodejs && rm /usr/local/bun-node-fallback-bin/node

ENV NODE_ENV=production
COPY package.json bun.lock scripts .
COPY scripts scripts
RUN bun install --production

COPY . .
RUN bun web

# TODO: replace this nginx with a SSR enabled server.
FROM nginx
EXPOSE 8901
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
  listen 8901;
  charset utf-8;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files \$uri \$uri/ /index.html;
  }
}
EOF

COPY --from=builder /app/dist /usr/share/nginx/html
