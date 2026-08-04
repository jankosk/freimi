# freimi

Battery-powered ESP32 + Waveshare e-paper frame.

The firmware wakes up, reads battery voltage, fetches a 1-bit BMP from the server, updates the display (full or partial refresh), then goes back to deep sleep.

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

- Install [espup](https://github.com/esp-rs/espup)
- Install [espflash](https://github.com/esp-rs/espflash#installation)
- Build project

```sh
cargo build
```

## Flash firmware

The firmware reads `WIFI_SSID`, `WIFI_PASSWORD`, and `FRAME_URL` at compile time.
Set them before flashing:

```sh
WIFI_SSID="your-wifi-name" \
WIFI_PASSWORD="your-wifi-password" \
FRAME_URL="http://<server-ip>:3000/frame"
cargo run --release
```
