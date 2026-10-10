import {
  TramFront,
  TrainFrontTunnel,
  TrainFront,
  Bus,
  Clock,
  Wind,
  UserRound,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
} from "lucide-static";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { StopDepartures, VehicleMode } from "./transit";
import type { Weather } from "./weather";
import { timeFormatter } from "./utils";

export interface FrameData {
  transit?: StopDepartures;
  weather?: Weather;
  battery?: number;
}

function batteryIcon(level: number): string {
  if (level >= 0.75) return BatteryFull;
  if (level >= 0.5) return BatteryMedium;
  if (level >= 0.2) return BatteryLow;
  return BatteryWarning;
}

function vehicleIcon(mode: VehicleMode): string {
  switch (mode) {
    case "SUBWAY":
      return TrainFrontTunnel;
    case "RAIL":
      return TrainFront;
    case "TRAM":
      return TramFront;
    case "BUS":
      return Bus;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function icon(svg: string, size = 20): string {
  return svg
    .replace(/width="\d+"/, `width="${size}"`)
    .replace(/height="\d+"/, `height="${size}"`)
    .replace(/stroke-width="\d+"/, `stroke-width="2.5"`);
}

const symbolDir = join(import.meta.dir, "..", "assets", "smartsymbol");
const symbolCache = new Map<number, string>();

function smartSymbolIcon(code: number, size = 20): string {
  let svg = symbolCache.get(code);
  if (svg === undefined) {
    try {
      svg = readFileSync(join(symbolDir, `${code}.svg`), "utf8");
    } catch {
      svg = readFileSync(join(symbolDir, "7.svg"), "utf8");
    }
    symbolCache.set(code, svg);
  }
  return icon(svg, size);
}

export function renderHtml(data: FrameData): string {
  const transitRows = data.transit
    ? data.transit.departures
        .map((d) => {
          const iconSvg = vehicleIcon(data.transit!.vehicleMode);
          return `<div class="transit-row">
            <span class="label">${icon(iconSvg)} ${escapeHtml(d.headsign)}</span>
            <span class="time">${d.time}</span>
          </div>`;
        })
        .join("\n      ")
    : `<div class="transit-row"><span class="label">No departures</span></div>`;

  const weatherCurrent = data.weather
    ? `<div class="weather-icon">${smartSymbolIcon(data.weather.current.symbol, 96)}</div>
        <div class="weather-info">
          <div class="weather-temp">${data.weather.current.temp}°</div>
          <div class="weather-wind">${icon(Wind, 16)} ${data.weather.current.wind} m/s</div>
          <div class="weather-feels">${icon(UserRound, 16)} ${data.weather.current.feelsLike}°</div>
        </div>`
    : `<div class="weather-desc">No weather data</div>`;

  const forecastItems = data.weather
    ? data.weather.forecast
        .map(
          (f) => `<div class="forecast-item">
          <div class="forecast-icon">${smartSymbolIcon(f.symbol, 44)}</div>
          <div class="forecast-info">
            <div class="forecast-time">${f.hour}</div>
            <div class="forecast-temp">${f.temp}°</div>
          </div>
        </div>`,
        )
        .join("\n        ")
    : "";

  const updated = new Date();
  const updatedTime = timeFormatter.format(updated);

  const battery =
    typeof data.battery === "number"
      ? `<span class="battery">${icon(batteryIcon(data.battery), 14)} ${Math.round(data.battery * 100)}%</span>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 800px;
    height: 480px;
    padding: 16px 46px;
    background: white;
    color: black;
    font-family: "Helvetica Neue", Arial, sans-serif;
    overflow: hidden;
    font-weight: 500;
  }
  .container {
    display: flex;
    height: 100%;
  }
  .left {
    width: 380px;
    padding: 24px;
    border-right: 1px solid black;
  }
  .right {
    flex: 1;
    padding: 24px;
    display: flex;
    flex-direction: column;
  }
  h1 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 16px;
  }
  h2 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 12px;
  }
  .transit-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid black;
    font-size: 18px;
  }
  .transit-row .label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .transit-row .time {
    font-weight: 700;
  }
  .weather-current {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 24px;
  }
  .weather-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .weather-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  }
  .weather-temp {
    font-size: 64px;
    font-weight: 700;
    line-height: 1;
  }
  .weather-wind {
    font-size: 18px;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .weather-feels {
    font-size: 18px;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .weather-desc {
    font-size: 18px;
    margin-top: 4px;
  }
  .forecast {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .forecast-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 8px;
    border: 1px solid black;
  }
  .forecast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .forecast-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  }
  .forecast-time {
    font-size: 16px;
    font-weight: 700;
  }
  .forecast-temp {
    font-size: 20px;
  }
  .updated {
    margin-top: auto;
    align-self: flex-end;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .updated > span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="left">
      ${transitRows}
    </div>
    <div class="right">
      <div class="weather-current">
        ${weatherCurrent}
      </div>
      <div class="forecast">
        ${forecastItems}
      </div>
      <div class="updated">${battery}<span>${icon(Clock, 12)} Updated ${updatedTime}</span></div>
    </div>
  </div>
</body>
</html>`;
}
