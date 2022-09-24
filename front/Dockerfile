FROM node:16-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN yarn build


FROM node:16-alpine
WORKDIR /app

COPY --from=builder /app/.next/standalone .
COPY --from=builder /app/.next/static ./.next/static/
COPY --from=builder /app/public ./public

EXPOSE 8901
ENV PORT 8901

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
CMD ["node", "server.js"]
