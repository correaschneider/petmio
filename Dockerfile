# syntax=docker/dockerfile:1
# Pet Mio — Next.js 16 multi-stage. pnpm via Corepack, versão pinada.
ARG NODE_IMAGE=node:24.16.0-alpine

FROM ${NODE_IMAGE} AS deps
ENV CI=true
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate && pnpm config set store-dir /pnpm/store
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# dev — usado pelo docker-compose (código montado por volume, hot reload)
FROM deps AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]

FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# runtime — saída standalone do Next, usuário não-root
FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
