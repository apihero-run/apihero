FROM node:lts-bullseye-slim AS pruner
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=webapp --docker
RUN find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Base strategy to have layer caching
FROM node:lts-bullseye-slim AS base
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
# COPY --from=pruner /app/out/full/ .

FROM base AS dev-deps
WORKDIR /app
RUN corepack enable
RUN pnpm install --ignore-scripts --frozen-lockfile

FROM base AS production-deps
WORKDIR /app
RUN corepack enable
ENV NODE_ENV production
RUN pnpm install --prod --frozen-lockfile
COPY --from=pruner /app/out/full/apps/webapp/prisma/schema.prisma /app/apps/webapp/prisma/schema.prisma
RUN pnpx prisma generate --schema /app/apps/webapp/prisma/schema.prisma

FROM base AS builder
WORKDIR /app
RUN corepack enable
ENV NODE_ENV production
COPY --from=pruner /app/out/full/ .
COPY --from=dev-deps /app/ .
COPY turbo.json turbo.json
RUN pnpm run generate
RUN pnpm run build --filter=webapp...

# Runner
FROM node:lts-bullseye-slim AS runner
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
RUN corepack enable
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 remixjs
RUN chown -R remixjs:nodejs /app
USER remixjs

COPY --from=pruner --chown=remixjs:nodejs /app/out/full/ .
COPY --from=production-deps --chown=remixjs:nodejs /app .
COPY --from=builder --chown=remixjs:nodejs /app/apps/webapp/app/styles/tailwind.css ./apps/webapp/app/styles/tailwind.css
COPY --from=builder --chown=remixjs:nodejs /app/apps/webapp/build/server.js ./apps/webapp/build/server.js
COPY --from=builder --chown=remixjs:nodejs /app/apps/webapp/build ./apps/webapp/build
COPY --from=builder --chown=remixjs:nodejs /app/apps/webapp/public ./apps/webapp/public
COPY --from=builder --chown=remixjs:nodejs /app/apps/webapp/prisma/schema.prisma ./apps/webapp/build/schema.prisma
COPY --from=builder --chown=remixjs:nodejs /app/apps/webapp/prisma/migrations ./apps/webapp/build/migrations
COPY --from=builder --chown=remixjs:nodejs /app/apps/webapp/node_modules/.prisma/client/libquery_engine-debian-openssl-1.1.x.so.node ./apps/webapp/build/libquery_engine-debian-openssl-1.1.x.so.node
COPY --from=builder --chown=fastify:nodejs /app/apps/webapp/node_modules/internal-logs ./apps/webapp/node_modules/internal-logs
COPY --from=builder --chown=fastify:nodejs /app/apps/webapp/node_modules/@apihero/node ./apps/webapp/node_modules/@apihero/node

# release_command = "pnpx prisma migrate deploy --schema apps/webapp/prisma/schema.prisma"
CMD ["pnpm", "--filter", "webapp", "run", "start"]