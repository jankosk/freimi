export const config = {
  port: Number(process.env.PORT) || 3000,
  digitransitKey: process.env.DIGITRANSIT_SUBSCRIPTION_KEY,
  openWeatherKey: process.env.OPENWEATHER_API_KEY,
  chromiumPath: process.env.CHROMIUM_PATH,
  stopId: process.env.STOP_ID,
};
