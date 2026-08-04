# freimi server

Bun + Playwright service that renders the dashboard HTML, screenshots it, and
returns a 1-bit BMP at `/frame`.

## Required environment variables

- `DIGITRANSIT_SUBSCRIPTION_KEY` — HSL Digitransit API key
- `OPENWEATHER_API_KEY` — OpenWeather API key
- `PORT` (optional, defaults to `3000`)

## Local development

```sh
bun install
bun start --watch
```

Go to `http://localhost:3000/frame` (append `?html=true` to get the rendered
HTML instead of the BMP).

## Docker

The image is built from `server/Dockerfile` and includes chromium plus its
runtime dependencies, so it can run the playwright screenshot pipeline as-is.

### Build

```sh
docker buildx build \
  --platform linux/amd64 \
  -t freimi-server:latest \
  .
```

### Run

```sh
docker run --rm -p 3000:3000 \
  -e DIGITRANSIT_SUBSCRIPTION_KEY=... \
  -e OPENWEATHER_API_KEY=... \
  freimi-server:latest
```
