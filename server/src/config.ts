export const config = {
  port: Number(process.env.PORT) || 3000,
  digitransitKey: process.env.DIGITRANSIT_SUBSCRIPTION_KEY,
  chromiumPath: process.env.CHROMIUM_PATH,
  stopId: process.env.STOP_ID,
};
