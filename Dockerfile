FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/oxlint-rules/package.json ./packages/oxlint-rules/

RUN pnpm install --frozen-lockfile

COPY apps/backend ./apps/backend
COPY packages/oxlint-rules ./packages/oxlint-rules
COPY specs ./specs

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "--filter", "backend", "start"]
