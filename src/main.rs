use embedded_graphics::{image::Image, pixelcolor::BinaryColor, prelude::*};
use epd_waveshare::{color::Color, epd7in5_v2::*, prelude::*};
use esp_idf_hal::delay::FreeRtos;
use esp_idf_hal::gpio::*;
use esp_idf_hal::peripherals::Peripherals;
use esp_idf_hal::spi::*;
use tinybmp::Bmp;

fn main() -> anyhow::Result<()> {
    esp_idf_sys::link_patches();
    let peripherals = Peripherals::take().unwrap();

    // 1. Setup SPI
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

    // 2. Setup Control Pins & Delay
    let busy = PinDriver::input(peripherals.pins.gpio25, Pull::Floating)?;
    let dc = PinDriver::output(peripherals.pins.gpio27)?;
    let rst = PinDriver::output(peripherals.pins.gpio26)?;
    let mut delay = FreeRtos;
    let mut epd = Epd7in5::new(&mut spi, busy, dc, rst, &mut delay, None)?;

    // 3. Draw image
    println!("Drawing image...");

    let mut display = Display7in5::default();
    display.clear(Color::White).ok();

    let bmp_data = include_bytes!("../frame.bmp");
    let bmp = Bmp::<BinaryColor>::from_slice(bmp_data).unwrap();

    Image::new(&bmp, Point::zero()).draw(&mut display.color_converted())?;

    epd.update_and_display_frame(&mut spi, display.buffer(), &mut delay)?;

    println!("Done!");
    epd.sleep(&mut spi, &mut delay)?;

    Ok(())
}
