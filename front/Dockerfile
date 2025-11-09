FROM oven/bun AS builder
WORKDIR /app

# https://github.com/oven-sh/bun/issues/24538
# Remember to also remove `tsx` after this bug is fixed
RUN apt update && apt install -y nodejs && rm /usr/local/bun-node-fallback-bin/node

ENV NODE_ENV=production
COPY package.json bun.lock .
COPY scripts scripts
COPY public public
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
