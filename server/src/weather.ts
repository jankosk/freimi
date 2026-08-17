const API_URL = "https://api.openweathermap.org/data/2.5/forecast";
const [LAT, LON] = ["60.16952", "24.93545"] // Helsinki
const LANG = 'fi'
const UNITS = "metric";

export type WeatherIconKey =
  | "sun"
  | "cloud"
  | "cloudSun"
  | "cloudRain"
  | "cloudDrizzle"
  | "cloudSnow"
  | "cloudLightning"
  | "cloudFog";

export interface WeatherSlot {
  hour: string; // "HH"
  temp: number; // rounded, °C
  wind: number; // rounded, m/s
  description: string;
  iconKey: WeatherIconKey;
}

export interface Weather {
  city: string;
  current: WeatherSlot;
  forecast: WeatherSlot[]; // next 4 slots, 3h apart
}

interface OwmListItem {
  dt: number;
  main: { temp: number };
  weather: Array<{ description: string; icon: string }>;
  wind: { speed: number };
}

interface OwmResponse {
  list: OwmListItem[];
  city: { name: string };
  cod?: string;
  message?: string;
}

function mapIcon(owmIcon: string): WeatherIconKey {
  const code = owmIcon.substring(0, 2);
  switch (code) {
    case "01":
      return "sun";
    case "02":
    case "03":
      return "cloudSun";
    case "04":
      return "cloud";
    case "09":
      return "cloudDrizzle";
    case "10":
      return "cloudRain";
    case "11":
      return "cloudLightning";
    case "13":
      return "cloudSnow";
    case "50":
      return "cloudFog";
    default:
      return "cloud";
  }
}

function toSlot(item: OwmListItem): WeatherSlot {
  const date = new Date(item.dt * 1000);
  const w = item.weather[0];
  return {
    hour: String(date.getHours()).padStart(2, "0"),
    temp: Math.round(item.main.temp),
    wind: Math.round(item.wind.speed),
    description: w.description.charAt(0).toUpperCase() + w.description.slice(1),
    iconKey: mapIcon(w.icon),
  };
}

export async function fetchWeather(): Promise<Weather> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    throw new Error("OPENWEATHER_API_KEY is not set");
  }

  const params = new URLSearchParams({ lat: LAT, lon: LON, lang: LANG, units: UNITS, appid: key });
  const res = await fetch(`${API_URL}?${params}`);

  if (!res.ok) {
    throw new Error(`OpenWeatherMap error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as OwmResponse;
  if (!json.list?.length) {
    throw new Error(`OpenWeatherMap: empty forecast list`);
  }

  const now = Date.now() / 1000;
  const currentIndex = json.list.reduce(
    (best, item, i) =>
      Math.abs(item.dt - now) < Math.abs(json.list[best].dt - now) ? i : best,
    0
  );

  return {
    city: json.city.name,
    current: toSlot(json.list[currentIndex]),
    forecast: json.list.slice(currentIndex + 1, currentIndex + 5).map(toSlot),
  };
}
