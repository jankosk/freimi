use anyhow::{Context, Result};
use core::sync::atomic::{AtomicU32, Ordering};
use esp_idf_hal::reset::ResetReason;
use esp_idf_svc::partition::EspPartition;

pub const FRAME_BYTES: usize = 800 * 480 / 8;
const SECTOR_SIZE: usize = 4096;
const ERASE_BYTES: usize = FRAME_BYTES.next_multiple_of(SECTOR_SIZE);

#[link_section = ".rtc.data"]
static PARTIAL_COUNT: AtomicU32 = AtomicU32::new(0);

pub fn cold_boot() -> bool {
    ResetReason::get() != ResetReason::DeepSleep
}

pub fn partial_count() -> u32 {
    PARTIAL_COUNT.load(Ordering::Relaxed)
}

pub fn set_partial_count(n: u32) {
    PARTIAL_COUNT.store(n, Ordering::Relaxed);
}

pub fn open_prev_frame() -> Result<EspPartition> {
    let part = unsafe { EspPartition::cnew(c"prev_frame") }
        .context("look up prev_frame partition")?
        .ok_or_else(|| anyhow::anyhow!("prev_frame partition not found"))?;
    if part.size() < FRAME_BYTES {
        anyhow::bail!(
            "prev_frame partition too small: {} bytes (need {})",
            part.size(),
            FRAME_BYTES
        );
    }
    Ok(part)
}

pub fn read_prev_frame(part: &mut EspPartition, buf: &mut [u8]) -> Result<()> {
    assert_eq!(buf.len(), FRAME_BYTES);
    part.read(0, buf).context("read prev_frame partition")?;
    Ok(())
}

pub fn write_prev_frame(part: &mut EspPartition, buf: &[u8]) -> Result<()> {
    assert_eq!(buf.len(), FRAME_BYTES);
    part.erase(0, ERASE_BYTES)
        .context("erase prev_frame partition")?;
    part.write(0, buf).context("write prev_frame partition")?;
    Ok(())
}
