FROM node:22-bookworm

WORKDIR /app

RUN corepack disable && npm install --global pnpm@11.7.0 && pnpm --version

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/prompting/package.json packages/prompting/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @vibeverify/worker exec playwright install --with-deps chromium

CMD ["pnpm", "--filter", "@vibeverify/worker", "start"]
