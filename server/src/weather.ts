import { hourFormatter } from "./utils";

const API_URL = "https://opendata.fmi.fi/timeseries";
const [LAT, LON] = ["60.16952", "24.93545"]; // Helsinki
const PARAMS = "time,temperature,feelslike,smartsymbol,windSpeedMS";
const FORECAST_INDEXES = [3, 6, 9, 12]; // every 3h, 12h ahead

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
}

interface FmiRow {
  time: string; // "YYYYMMDDTHHMMSS" (UTC)
  temperature: number;
  feelslike: number;
  smartsymbol: number;
  windSpeedMS: number;
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
  const endtime = new Date(Date.now() + 16 * 3600 * 1000).toISOString().replace(/\.\d+Z$/, "Z");
  const params = new URLSearchParams({
    latlon: `${LAT},${LON}`,
    param: PARAMS,
    format: "json",
    timestep: "60",
    tz: "UTC",
    lang: "fi",
    endtime,
  });

  const res = await fetch(`${API_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`FMI error: ${res.status} ${res.statusText}`);
  }

  const rows = (await res.json()) as FmiRow[];
  if (!Array.isArray(rows) || rows.length <= Math.max(...FORECAST_INDEXES)) {
    throw new Error("FMI: not enough forecast rows");
  }

  return {
    current: toSlot(rows[0]),
    forecast: FORECAST_INDEXES.map((i) => toSlot(rows[i])),
  };
}
