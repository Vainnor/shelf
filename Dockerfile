# syntax=docker/dockerfile:1.7

ARG APP_VERSION=0.0.1
ARG GIT_SHA=dev

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["pnpm", "dev"]

FROM deps AS migrator
ENV NODE_ENV=development
COPY . .
CMD ["pnpm", "drizzle-kit", "push"]

FROM base AS builder
ARG APP_VERSION
ARG GIT_SHA
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_APP_VERSION=${APP_VERSION}.${GIT_SHA}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
ARG APP_VERSION=0.0.1
ARG GIT_SHA=dev
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV APP_VERSION=${APP_VERSION}.${GIT_SHA}
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json
LABEL org.opencontainers.image.title="Shelf" \
  org.opencontainers.image.version="${APP_VERSION}.${GIT_SHA}" \
  org.opencontainers.image.revision="${GIT_SHA}"
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

