import fs from 'node:fs';
import { PNG } from 'pngjs';

const input = process.argv[2];
if (!input) throw Error('Usage: node native-notes/screenshot.mjs frame.bin');
const frame = JSON.parse(fs.readFileSync(input + '.json', 'utf8'));
const bytes = fs.readFileSync(input);
const image = new PNG({ width: frame.width, height: frame.height });
const mask = (1 << frame.bpp) - 1;
for (let pixel = 0; pixel < frame.width * frame.height; pixel++) {
  const byte = bytes[Math.floor((pixel * frame.bpp) / 8)];
  const shift = 8 - frame.bpp - ((pixel * frame.bpp) % 8);
  const level = ((byte >> shift) & mask) / mask;
  const offset = pixel * 4;
  image.data[offset] = Math.round(level * 105);
  image.data[offset + 1] = Math.round(level * 255);
  image.data[offset + 2] = Math.round(level * 145);
  image.data[offset + 3] = 255;
}
fs.writeFileSync(input + '.png', PNG.sync.write(image));
console.log(input + '.png');
