import sharp from "sharp";

const WIDTH = 800;
const HEIGHT = 480;
const ROW_BYTES = WIDTH / 8; // 100 bytes per row
const PIXEL_DATA_SIZE = ROW_BYTES * HEIGHT; // 48000
const HEADER_SIZE = 14 + 40 + 8; // file header + DIB header + color table
const FILE_SIZE = HEADER_SIZE + PIXEL_DATA_SIZE; // 48062

export async function convertToBmp(pngBuffer: Buffer): Promise<Buffer> {
  const { data } = await sharp(pngBuffer)
    .resize(WIDTH, HEIGHT, { fit: "fill" })
    .greyscale()
    .threshold(128)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bmp = Buffer.alloc(FILE_SIZE);

  // BMP File Header (14 bytes)
  bmp.write("BM", 0);
  bmp.writeUInt32LE(FILE_SIZE, 2);
  bmp.writeUInt32LE(0, 6); // reserved
  bmp.writeUInt32LE(HEADER_SIZE, 10); // pixel data offset

  // BITMAPINFOHEADER (40 bytes)
  bmp.writeUInt32LE(40, 14); // DIB header size
  bmp.writeInt32LE(WIDTH, 18);
  bmp.writeInt32LE(HEIGHT, 22); // positive = bottom-up row order
  bmp.writeUInt16LE(1, 26); // color planes
  bmp.writeUInt16LE(1, 28); // bits per pixel
  bmp.writeUInt32LE(0, 30); // compression (none)
  bmp.writeUInt32LE(PIXEL_DATA_SIZE, 34);
  bmp.writeInt32LE(2835, 38); // X pixels per meter (~72 DPI)
  bmp.writeInt32LE(2835, 42); // Y pixels per meter
  bmp.writeUInt32LE(2, 46); // colors used
  bmp.writeUInt32LE(2, 50); // important colors

  // Color Table (8 bytes: 2 entries x 4 bytes BGRA)
  bmp.writeUInt32LE(0x00000000, 54); // entry 0: black
  bmp.writeUInt32LE(0x00ffffff, 58); // entry 1: white

  // Pixel Data (bottom-to-top row order)
  for (let y = 0; y < HEIGHT; y++) {
    // BMP row 0 = bottom of image = source row (HEIGHT - 1)
    const srcY = HEIGHT - 1 - y;
    const bmpRowOffset = HEADER_SIZE + y * ROW_BYTES;

    for (let x = 0; x < WIDTH; x++) {
      const pixel = data[srcY * WIDTH + x];
      if (pixel > 0) {
        // white pixel: set bit to 1
        const byteIndex = x >> 3;
        const bitIndex = 7 - (x & 7); // MSB first
        bmp[bmpRowOffset + byteIndex] |= 1 << bitIndex;
      }
    }
  }

  return bmp;
}
