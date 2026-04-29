use embedded_graphics::{image::Image, pixelcolor::BinaryColor, prelude::*};
use embedded_svc::http::client::Client;
use epd_waveshare::{color::Color, epd7in5_v2::*, prelude::*};
use esp_idf_hal::delay::FreeRtos;
use esp_idf_hal::gpio::*;
use esp_idf_hal::peripherals::Peripherals;
use esp_idf_hal::spi::*;
use esp_idf_svc::eventloop::EspSystemEventLoop;
use esp_idf_svc::http::client::{Configuration as HttpConfiguration, EspHttpConnection};
use esp_idf_svc::nvs::EspDefaultNvsPartition;
use esp_idf_svc::wifi::{
    AuthMethod, BlockingWifi, ClientConfiguration, Configuration as WifiConfiguration, EspWifi,
};
use tinybmp::Bmp;

mod display;
mod frame_diff;
mod persistence;

const WIFI_SSID: Option<&str> = option_env!("WIFI_SSID");
const WIFI_PASSWORD: Option<&str> = option_env!("WIFI_PASSWORD");
const FRAME_URL: Option<&str> = option_env!("FRAME_URL");
const SLEEP_MINUTES: u64 = 30;
const PARTIAL_BEFORE_FULL: u32 = 3;

fn main() -> ! {
    esp_idf_sys::link_patches();

    if let Err(err) = run() {
        eprintln!("run() failed: {err:?}");
    }

    println!("Deep sleeping for {} minute(s)...", SLEEP_MINUTES);
    unsafe { esp_idf_sys::esp_deep_sleep(SLEEP_MINUTES * 60 * 1_000_000) }
}

fn run() -> anyhow::Result<()> {
    let wifi_ssid =
        WIFI_SSID.ok_or_else(|| anyhow::anyhow!("WIFI_SSID not set at compile time"))?;
    let wifi_password =
        WIFI_PASSWORD.ok_or_else(|| anyhow::anyhow!("WIFI_PASSWORD not set at compile time"))?;
    let frame_url =
        FRAME_URL.ok_or_else(|| anyhow::anyhow!("FRAME_URL not set at compile time"))?;

    let cold_boot = persistence::cold_boot();
    let partial_count = persistence::partial_count();
    println!("Boot: cold={cold_boot} partial_count={partial_count}");

    let peripherals = Peripherals::take().unwrap();
    let sysloop = EspSystemEventLoop::take()?;
    let nvs = EspDefaultNvsPartition::take()?;

    // 1. Connect to WiFi
    let mut wifi = BlockingWifi::wrap(
        EspWifi::new(peripherals.modem, sysloop.clone(), Some(nvs))?,
        sysloop,
    )?;
    wifi.set_configuration(&WifiConfiguration::Client(ClientConfiguration {
        ssid: wifi_ssid.try_into().unwrap(),
        password: wifi_password.try_into().unwrap(),
        auth_method: AuthMethod::WPA2Personal,
        ..Default::default()
    }))?;
    wifi.start()?;
    wifi.connect()?;
    wifi.wait_netif_up()?;
    println!("WiFi connected");

    // 2. Fetch BMP over HTTP
    println!("Fetching {}", frame_url);
    let mut client = Client::wrap(EspHttpConnection::new(&HttpConfiguration {
        buffer_size: Some(4096),
        ..Default::default()
    })?);
    let mut response = client.get(frame_url)?.submit()?;

    let mut bmp_data: Vec<u8> = Vec::with_capacity(64 * 1024);
    let mut buf = [0u8; 1024];
    loop {
        let n = response.read(&mut buf)?;
        if n == 0 {
            break;
        }
        bmp_data.extend_from_slice(&buf[..n]);
    }
    println!("Fetched {} bytes", bmp_data.len());

    // 3. Setup SPI
    let spi_config = config::Config::new().baudrate(4_000_000.into());
    let bus_config = config::DriverConfig::default();
    let mut spi = SpiDeviceDriver::new_single(
        peripherals.spi2,
        peripherals.pins.gpio13, // SCLK
        peripherals.pins.gpio14, // MOSI
        None::<AnyIOPin>,
        Some(peripherals.pins.gpio15), // CS
        &bus_config,
        &spi_config,
    )?;

    // 4. Setup Control Pins & Delay
    let busy = PinDriver::input(peripherals.pins.gpio25, Pull::Floating)?;
    let dc = PinDriver::output(peripherals.pins.gpio27)?;
    let rst = PinDriver::output(peripherals.pins.gpio26)?;
    let mut delay = FreeRtos;
    let mut epd = Epd7in5::new(&mut spi, busy, dc, rst, &mut delay, None)?;

    // 5. Render new BMP into the framebuffer
    let mut new_display = Display7in5::default();
    new_display.clear(Color::White).ok();
    {
        let bmp = Bmp::<BinaryColor>::from_slice(&bmp_data).unwrap();
        Image::new(&bmp, Point::zero()).draw(&mut new_display.color_converted())?;
    }
    drop(bmp_data);
    let new_buf = new_display.buffer();

    // 6. Decide full vs partial, then update display + persisted prev frame
    let mut prev_part = persistence::open_prev_frame()?;
    let force_full = cold_boot || partial_count >= PARTIAL_BEFORE_FULL;

    let next_count = if force_full {
        println!("Full refresh");
        display::render_full(&mut epd, &mut spi, &mut delay, new_buf)?;
        persistence::write_prev_frame(&mut prev_part, new_buf)?;
        0
    } else {
        let mut prev_buf = vec![0u8; persistence::FRAME_BYTES];
        persistence::read_prev_frame(&mut prev_part, &mut prev_buf)?;
        match frame_diff::bbox(&prev_buf, new_buf) {
            None => {
                println!("No change; skipping refresh");
                partial_count
            }
            Some(bbox) => {
                println!(
                    "Partial refresh: x={} y={} w={} h={}",
                    bbox.x, bbox.y, bbox.width, bbox.height
                );
                let partial = frame_diff::extract(new_buf, &bbox);
                display::render_partial(
                    &mut epd,
                    &mut spi,
                    &mut delay,
                    &mut prev_buf,
                    &partial,
                    &bbox,
                )?;
                persistence::write_prev_frame(&mut prev_part, new_buf)?;
                partial_count + 1
            }
        }
    };

    persistence::set_partial_count(next_count);
    println!("Next partial_count = {next_count}");

    epd.sleep(&mut spi, &mut delay)?;
    Ok(())
}
