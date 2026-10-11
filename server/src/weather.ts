import { dayFormatter, hourFormatter, timeFormatter } from "./utils";

const API_URL = "https://opendata.fmi.fi/timeseries";
const [LAT, LON] = ["60.16952", "24.93545"]; // Helsinki
const PARAMS = "time,temperature,feelslike,smartsymbol,windSpeedMS,sunrise,sunset";
const FORECAST_INDEXES = [2, 4, 6, 8]; // every 2h, 8h ahead

export interface WeatherSlot {
  hour: string; // "HH" in Helsinki time
  temp: number; // rounded, °C
  feelsLike: number; // rounded, °C
  wind: number; // rounded, m/s
  symbol: number; // FMI smartSymbol code
}

export interface Weather {
  current: WeatherSlot;
  forecast: WeatherSlot[];
  sunrise: string; // "HH:MM" in Helsinki time, today
  sunset: string; // "HH:MM" in Helsinki time, today
}

interface FmiRow {
  time: string; // "YYYYMMDDTHHMMSS" (UTC)
  temperature: number;
  feelslike: number;
  smartsymbol: number;
  windSpeedMS: number;
  sunrise: string; // "YYYYMMDDTHHMMSS" (UTC), per calendar day
  sunset: string; // "YYYYMMDDTHHMMSS" (UTC), per calendar day
}

function parseUtcTime(s: string): Date {
  const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z`;
  return new Date(iso);
}

function toSlot(row: FmiRow): WeatherSlot {
  return {
    hour: hourFormatter.format(parseUtcTime(row.time)),
    temp: Math.round(row.temperature),
    feelsLike: Math.round(row.feelslike),
    wind: Math.round(row.windSpeedMS),
    symbol: Number(row.smartsymbol),
  };
}

export async function fetchWeather(): Promise<Weather> {
  const now = new Date();
  const starttime = new Date(now.getTime() - 2 * 3600 * 1000).toISOString().replace(/\.\d+Z$/, "Z");
  const endtime = new Date(now.getTime() + 16 * 3600 * 1000).toISOString().replace(/\.\d+Z$/, "Z");
  const params = new URLSearchParams({
    latlon: `${LAT},${LON}`,
    param: PARAMS,
    format: "json",
    timestep: "60",
    tz: "UTC",
    lang: "fi",
    starttime,
    endtime,
  });

  const res = await fetch(`${API_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`FMI error: ${res.status} ${res.statusText}`);
  }

  const rows = (await res.json()) as FmiRow[];
  if (!Array.isArray(rows)) {
    throw new Error("FMI: unexpected response");
  }

  const nowMs = now.getTime();
  let currentIndex = 0;
  let closest = Infinity;
  for (let i = 0; i < rows.length; i++) {
    const diff = Math.abs(parseUtcTime(rows[i].time).getTime() - nowMs);
    if (diff < closest) {
      closest = diff;
      currentIndex = i;
    }
  }

  if (rows.length <= currentIndex + Math.max(...FORECAST_INDEXES)) {
    throw new Error("FMI: not enough forecast rows");
  }

  const today = dayFormatter.format(now);
  const todayRow = rows.find((r) => dayFormatter.format(parseUtcTime(r.time)) === today) ?? rows[0];

  return {
    current: toSlot(rows[currentIndex]),
    forecast: FORECAST_INDEXES.map((i) => toSlot(rows[currentIndex + i])),
    sunrise: timeFormatter.format(parseUtcTime(todayRow.sunrise)),
    sunset: timeFormatter.format(parseUtcTime(todayRow.sunset)),
  };
}
