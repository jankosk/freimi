import {
  TramFront,
  TrainFrontTunnel,
  TrainFront,
  Bus,
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
import type { Weather, WeatherIconKey } from "./weather";

export interface FrameData {
  transit?: StopDepartures;
  weather?: Weather;
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

const weatherIcons: Record<WeatherIconKey, string> = {
  sun: Sun,
  cloud: Cloud,
  cloudSun: CloudSun,
  cloudRain: CloudRain,
  cloudDrizzle: CloudDrizzle,
  cloudSnow: CloudSnow,
  cloudLightning: CloudLightning,
  cloudFog: CloudFog,
};

export function renderHtml(data: FrameData): string {
  const transitRows = data.transit
    ? data.transit.departures
        .map((d) => {
          const iconSvg = vehicleIcon(data.transit!.vehicleMode);
          return `<div class="transit-row"><span class="label">${icon(iconSvg)} ${escapeHtml(d.headsign)}</span><span>${d.time}</span></div>`;
        })
        .join("\n      ")
    : `<div class="transit-row"><span class="label">No departures</span></div>`;

  const weatherCurrent = data.weather
    ? `${icon(weatherIcons[data.weather.current.iconKey], 48)}
        <div class="weather-temp">${data.weather.current.temp}°</div>
        <div class="weather-desc">${escapeHtml(data.weather.current.description)}</div>`
    : `<div class="weather-desc">No weather data</div>`;

  const forecastItems = data.weather
    ? data.weather.forecast
        .map(
          (f) => `<div class="forecast-item">
          <div class="forecast-time">${f.hour}</div>
          <div class="forecast-icon">${icon(weatherIcons[f.iconKey], 28)}</div>
          <div class="forecast-temp">${f.temp}°</div>
        </div>`,
        )
        .join("\n        ")
    : "";

  const updated = new Date();
  const updatedTime = `${String(updated.getHours()).padStart(2, "0")}:${String(updated.getMinutes()).padStart(2, "0")}`;

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
        ${weatherCurrent}
      </div>
      <div class="forecast">
        ${forecastItems}
      </div>
      <div class="updated">${icon(Clock, 12)} Updated ${updatedTime}</div>
    </div>
  </div>
</body>
</html>`;
}
