pub const WIDTH: u32 = 800;
pub const HEIGHT: u32 = 480;
const STRIDE: usize = (WIDTH / 8) as usize;

pub struct Bbox {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

pub fn bbox(prev: &[u8], new: &[u8]) -> Option<Bbox> {
    assert_eq!(prev.len(), STRIDE * HEIGHT as usize);
    assert_eq!(new.len(), STRIDE * HEIGHT as usize);

    let mut min_xb = STRIDE;
    let mut max_xb = 0usize;
    let mut min_y = HEIGHT as usize;
    let mut max_y = 0usize;
    let mut any = false;

    for y in 0..HEIGHT as usize {
        let row = y * STRIDE;
        for xb in 0..STRIDE {
            if prev[row + xb] != new[row + xb] {
                any = true;
                if xb < min_xb {
                    min_xb = xb;
                }
                if xb > max_xb {
                    max_xb = xb;
                }
                if y < min_y {
                    min_y = y;
                }
                if y > max_y {
                    max_y = y;
                }
            }
        }
    }

    if !any {
        return None;
    }

    Some(Bbox {
        x: (min_xb * 8) as u32,
        y: min_y as u32,
        width: ((max_xb - min_xb + 1) * 8) as u32,
        height: (max_y - min_y + 1) as u32,
    })
}

pub fn extract(buf: &[u8], bbox: &Bbox) -> Vec<u8> {
    let bbox_stride = (bbox.width / 8) as usize;
    let start_xb = (bbox.x / 8) as usize;
    let mut out = Vec::with_capacity(bbox_stride * bbox.height as usize);
    for y in 0..bbox.height as usize {
        let row = (bbox.y as usize + y) * STRIDE + start_xb;
        out.extend_from_slice(&buf[row..row + bbox_stride]);
    }
    out
}
