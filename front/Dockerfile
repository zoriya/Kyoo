FROM node:16-alpine AS builder
WORKDIR /app
COPY .yarn ./.yarn
COPY .yarnrc.yml ./
COPY package.json yarn.lock ./
RUN yarn --immutabe

COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN yarn build:web


FROM node:16-alpine
WORKDIR /app

COPY --from=builder /app/packages/web/.next/standalone .
COPY --from=builder /app/packages/web/.next/static ./.next/static/
COPY --from=builder /app/packages/web/public ./public

EXPOSE 8901
ENV PORT 8901

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
CMD ["node", "server.js"]
