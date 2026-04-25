FROM oven/bun:1-debian

WORKDIR /app

USER root

COPY package.json bun.lock ./

# `bun install` triggers the postinstall script that downloads the chromium
# browser binary via playwright.
RUN bun install --frozen-lockfile

# Install the OS libraries chromium needs at runtime.
RUN bunx playwright install-deps chromium && \
    rm -rf /var/lib/apt/lists/*

COPY tsconfig.json ./
COPY src ./src

ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
