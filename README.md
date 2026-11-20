# freimi

Battery-powered ESP32 + Waveshare e-paper frame for displaying local weather and transit information.

The firmware wakes up, reads battery voltage, fetches a 1-bit BMP from the server, updates the display (full or partial refresh), then goes back to deep sleep and schedules next wake up.

## Overview

This project has two main components:

- ESP32 device (repo root): connects to Wi-Fi, reads battery level, fetches image, drives e-paper panel
- Bun server (`./server`): builds the dashboard image from HTML page and returns a 1-bit BMP at `/frame`

```
      Weather + Transit APIs
              |
              ▼
   ┌-----------------------┐
   │ Bun server            │ 
   │ endpoint: /frame      │ 
   └-----------------------┘
               |
          Wi-Fi HTTP (BMP img)
               |
               ▼
   ┌-----------------------┐
   │ Waveshare ESP32 board │ 
   │  - reads battery ADC  │ 
   │  - fetches /frame BMP │ 
   │  - updates e-paper    │ 
   └-----------------------┘
               |
               ▼
      Waveshare 7.5" e-paper
```

## Schematic

```
                  [ LiPo Battery ]
                        │ (JST)
                        ▼
            ┌───────────────────────┐
            │  LiPo Charger Module  │
            └─────┬──────────┬──────┘
          (OUT +) │          │ (OUT -)
                  │          │
      ┌───────────┤          ├───────────┐
      │           │          │           │
      │        [100kΩ]    [100kΩ]        │
      │        (Res A)    (Res B)        │
      │           │          │           │
      │           └────┬─────┘           │
      │                │                 │
      ▼                ▼                 ▼
┌──────────────────────────────────────────────┐
│   [ 5V ]          [ P34 ]          [ GND ]   │
│                                              │
│            Waveshare ESP32 Board             │
└──────────────────────────────────────────────┘
```

## Electronic components

- 1x Waveshare e-Paper ESP32 driver board
- 1x Waveshare 7.5" e-paper display
- 1x 3.7V 5000mAh LiPo battery (JST plug)
- 1x SparkFun LiPo Charger Plus
- 2x 100k resistor (battery divider)
- 2x male-to-female jumper wires

## Setup

Build tasks live in the `justfile`. Python is used only by ESP-IDF's own
tooling, which creates and manages its own virtualenv under `.embuild`. Rust is
managed by `rustup` via the `esp` Xtensa toolchain selected by
`rust-toolchain.toml`.

### Prerequisites

Install once, system-wide:

1. [rustup](https://rustup.rs/) — provides `cargo` and `rustup`
2. [just](https://github.com/casey/just#installation) — task runner
3. Python **3.9–3.13** available as `python3` on `PATH`. ESP-IDF shells out to
   `python3` and creates its own virtualenv from it, so the interpreter needs
   `venv`/`ensurepip` support.

`espup`, `espflash`, and `ldproxy` are installed by `just setup` if missing.

### Bootstrap and build

Install the Espressif Rust toolchain and its linker proxy (one-time, downloads
several GB):

```sh
just setup
```

Then build (the recipes source the generated ESP environment):

```sh
just build
```

> On the first build, ESP-IDF is downloaded and compiled, which takes a while.
> The `espup install` step writes `~/export-esp.sh`, which is sourced by `just` automatically.

## Flash firmware

The firmware reads `WIFI_SSID`, `WIFI_PASSWORD`, and `FRAME_URL` at compile time.
Set them before flashing:

```sh
WIFI_SSID="your-wifi-name" \
WIFI_PASSWORD="your-wifi-password" \
FRAME_URL="http://<server-host>:3000/frame" \
just run
```
