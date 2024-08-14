FROM node:18-alpine AS builder
WORKDIR /app
COPY .yarn ./.yarn
COPY .yarnrc.yml ./
COPY package.json yarn.lock ./
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/primitives/package.json packages/primitives/package.json
COPY packages/models/package.json packages/models/package.json
RUN yarn --immutable

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN yarn build:web


FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/apps/web/.next/standalone/apps/web .
COPY --from=builder /app/apps/web/.next/standalone/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next/static ./.next/static/
COPY --from=builder /app/apps/web/public ./public

EXPOSE 8901
ENV PORT=8901

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
CMD ["node", "server.js"]
