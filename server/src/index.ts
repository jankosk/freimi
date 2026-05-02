import { renderHtml } from "./render";
import { initBrowser, screenshotHtml, closeBrowser } from "./screenshot";
import { convertToBmp } from "./convert";
import { fetchDepartures } from "./transit";
import { fetchWeather } from "./weather";

const PORT = Number(process.env.PORT) || 3000;

await initBrowser();
console.log("Browser ready");

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/frame") {
      const [transit, weather] = await Promise.all([
        fetchDepartures(),
        fetchWeather(),
      ]);

      const batteryParam = url.searchParams.get("battery");
      const batteryNum = batteryParam !== null ? Number(batteryParam) : NaN;
      const battery =
        Number.isFinite(batteryNum) && batteryNum >= 0 && batteryNum <= 1
          ? batteryNum
          : undefined;

      const html = renderHtml({ transit, weather, battery });

      if (url.searchParams.get("html") === "true") {
        return new Response(html, {
          headers: { "Content-Type": "text/html" },
        });
      }

      const png = await screenshotHtml(html);
      const bmp = await convertToBmp(png);

      return new Response(new Uint8Array(bmp), {
        headers: { "Content-Type": "image/bmp" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Listening on http://localhost:${server.port}/frame`);

process.on("SIGINT", async () => {
  await closeBrowser();
  process.exit(0);
});
