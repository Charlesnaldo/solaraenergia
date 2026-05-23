import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function getLogoPngBuffer() {
  const svgPath = path.join(process.cwd(), 'public/Solara2.svg');

  const svgBuffer = fs.readFileSync(svgPath);

  return await sharp(svgBuffer)
    .png()
    .resize(320)
    .toBuffer();
}
