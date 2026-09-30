FROM node:22-bookworm-slim

WORKDIR /app

# better-sqlite3 may need a local native build on the target architecture.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable \
  && corepack prepare pnpm@9.15.9 --activate

COPY . .

RUN pnpm install --frozen-lockfile \
  && pnpm build

ENV NODE_ENV=production

CMD ["pnpm", "start"]
