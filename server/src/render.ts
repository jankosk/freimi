import {
  TramFront,
  TrainFrontTunnel,
  TrainFront,
  Bus,
  Ship,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudSun,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  Sun,
  Clock,
} from "lucide-static";
import type { StopDepartures, VehicleMode } from "./transit";

export interface FrameData {
  transit?: StopDepartures;
  // TODO: Add weather API data type
}

function vehicleIcon(mode: VehicleMode): string {
  switch (mode) {
    case "SUBWAY":
      return TrainFrontTunnel;
    case "RAIL":
      return TrainFront;
    case "TRAM":
      return TramFront;
    case "FERRY":
      return Ship;
    case "BUS":
    case "TROLLEYBUS":
      return Bus;
    default:
      return TramFront;
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

export const weatherIcons = {
  sun: Sun,
  cloud: Cloud,
  cloudSun: CloudSun,
  cloudRain: CloudRain,
  cloudDrizzle: CloudDrizzle,
  cloudSnow: CloudSnow,
  cloudLightning: CloudLightning,
  cloudFog: CloudFog,
} as const;

export function renderHtml(data: FrameData): string {
  const transitRows = data.transit
    ? data.transit.departures
        .map((d) => {
          const iconSvg = vehicleIcon(data.transit!.vehicleMode);
          return `<div class="transit-row"><span class="label">${icon(iconSvg)} ${escapeHtml(d.headsign)}</span><span>${d.time}</span></div>`;
        })
        .join("\n      ")
    : `<div class="transit-row"><span class="label">No departures</span></div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 800px;
    height: 480px;
    background: white;
    color: black;
    font-family: "Helvetica Neue", Arial, sans-serif;
    overflow: hidden;
    -webkit-font-smoothing: none;
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
  .weather-current {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 24px;
  }
  .weather-current > svg {
    margin-bottom: 8px;
  }
  .weather-temp {
    font-size: 64px;
    font-weight: 700;
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
    flex-direction: column;
    align-items: center;
    padding: 8px;
    border: 1px solid black;
  }
  .forecast-time {
    font-size: 16px;
    font-weight: 700;
  }
  .forecast-icon {
    margin: 4px 0;
  }
  .forecast-temp {
    font-size: 20px;
  }
  .updated {
    position: absolute;
    bottom: 12px;
    right: 24px;
    font-size: 12px;
    display: flex;
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
        <!-- TODO: Replace with real weather data -->
        ${icon(CloudRain, 48)}
        <div class="weather-temp">10°</div>
        <div class="weather-desc">Rain</div>
      </div>
      <div class="forecast">
        <div class="forecast-item">
          <div class="forecast-time">01</div>
          <div class="forecast-icon">${icon(CloudRain, 28)}</div>
          <div class="forecast-temp">10°</div>
        </div>
        <div class="forecast-item">
          <div class="forecast-time">04</div>
          <div class="forecast-icon">${icon(CloudDrizzle, 28)}</div>
          <div class="forecast-temp">8°</div>
        </div>
        <div class="forecast-item">
          <div class="forecast-time">07</div>
          <div class="forecast-icon">${icon(Cloud, 28)}</div>
          <div class="forecast-temp">7°</div>
        </div>
        <div class="forecast-item">
          <div class="forecast-time">10</div>
          <div class="forecast-icon">${icon(CloudSun, 28)}</div>
          <div class="forecast-temp">8°</div>
        </div>
      </div>
      <div class="updated">${icon(Clock, 12)} Updated 22:03</div>
    </div>
  </div>
</body>
</html>`;
}
