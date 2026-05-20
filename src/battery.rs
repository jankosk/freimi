use esp_idf_hal::adc::attenuation::DB_12;
use esp_idf_hal::adc::oneshot::config::{AdcChannelConfig, Calibration};
use esp_idf_hal::adc::oneshot::{AdcChannelDriver, AdcDriver};
use esp_idf_hal::adc::ADC1;
use esp_idf_hal::gpio::Gpio34;

// LiPo battery range used to map measured voltage to a 0..1 charge level.
const BATTERY_FULL_MV: u32 = 4200;
const BATTERY_EMPTY_MV: u32 = 3300;
// Two equal resistors form a 1:2 divider between VBAT and GND, so the ADC
// reads half of the battery voltage.
const BATTERY_DIVIDER_RATIO: u32 = 2;
const BATTERY_SAMPLES: u32 = 16;

pub fn read(adc: ADC1<'static>, pin: Gpio34<'static>) -> anyhow::Result<f32> {
    let adc = AdcDriver::new(adc)?;
    let config = AdcChannelConfig {
        attenuation: DB_12,
        calibration: Calibration::Line,
        ..Default::default()
    };
    let mut channel = AdcChannelDriver::new(&adc, pin, &config)?;

    let mut sum: u32 = 0;
    for _ in 0..BATTERY_SAMPLES {
        sum += adc.read(&mut channel)? as u32;
    }
    let adc_mv = sum / BATTERY_SAMPLES;
    let battery_mv = adc_mv * BATTERY_DIVIDER_RATIO;
    println!("Battery: ADC={adc_mv} mV, VBAT={battery_mv} mV");

    let level = if battery_mv >= BATTERY_FULL_MV {
        1.0
    } else if battery_mv <= BATTERY_EMPTY_MV {
        0.0
    } else {
        (battery_mv - BATTERY_EMPTY_MV) as f32 / (BATTERY_FULL_MV - BATTERY_EMPTY_MV) as f32
    };
    Ok(level)
}
