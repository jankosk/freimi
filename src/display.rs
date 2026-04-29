use embedded_hal::{
    delay::DelayNs,
    digital::{InputPin, OutputPin},
    spi::SpiDevice,
};
use epd_waveshare::{
    epd7in5_v2::Epd7in5,
    prelude::{RefreshLut, WaveshareDisplay},
};

use crate::frame_diff::Bbox;

// The dexterdy fork programs VcomAndDataIntervalSetting (0x50) with 0x29, which
// clears the DDX bit and inverts how the panel interprets pixel bytes vs. the
// published 0.6.0 driver. Until a polarity-fixed driver lands, invert here.
fn invert(buf: &[u8]) -> Vec<u8> {
    buf.iter().map(|b| !b).collect()
}

fn invert_in_place(buf: &mut [u8]) {
    for b in buf.iter_mut() {
        *b = !*b;
    }
}

pub fn render_full<SPI, BUSY, DC, RST, DELAY>(
    epd: &mut Epd7in5<SPI, BUSY, DC, RST, DELAY>,
    spi: &mut SPI,
    delay: &mut DELAY,
    buf: &[u8],
) -> Result<(), SPI::Error>
where
    SPI: SpiDevice,
    BUSY: InputPin,
    DC: OutputPin,
    RST: OutputPin,
    DELAY: DelayNs,
{
    epd.set_lut(spi, delay, Some(RefreshLut::Full))?;
    epd.update_and_display_frame(spi, &invert(buf), delay)
}

pub fn render_partial<SPI, BUSY, DC, RST, DELAY>(
    epd: &mut Epd7in5<SPI, BUSY, DC, RST, DELAY>,
    spi: &mut SPI,
    delay: &mut DELAY,
    prev_buf: &mut [u8],
    partial: &[u8],
    bbox: &Bbox,
) -> Result<(), SPI::Error>
where
    SPI: SpiDevice,
    BUSY: InputPin,
    DC: OutputPin,
    RST: OutputPin,
    DELAY: DelayNs,
{
    // Re-establish the panel's OLD/NEW buffers from prev (wiped during deep
    // sleep). Without this, the partial-LUT drives pixels from garbage->new
    // and produces ghosting whenever the bbox content actually changes.
    invert_in_place(prev_buf);
    epd.update_old_frame(spi, prev_buf)?;
    epd.update_frame(spi, prev_buf, delay)?;

    epd.set_lut(spi, delay, Some(RefreshLut::PartialRefresh))?;
    epd.update_partial_frame(
        spi,
        delay,
        &invert(partial),
        bbox.x,
        bbox.y,
        bbox.width,
        bbox.height,
    )?;
    epd.display_frame(spi, delay)
}
