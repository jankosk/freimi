FROM oven/bun:1-alpine

WORKDIR /app

RUN apk add --no-cache \
        chromium \
        ttf-freefont

# Don't download playwright's bundled chromium — it's glibc-only.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV CHROMIUM_PATH=/usr/bin/chromium

COPY package.json bun.lock ./
RUN bun install --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
COPY assets ./assets

RUN chown -R bun:bun /app
USER bun

ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
