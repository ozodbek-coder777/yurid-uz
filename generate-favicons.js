import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.join(process.cwd(), 'public', 'favicon.svg');
const publicDir = path.join(process.cwd(), 'public');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-180x180.png', size: 180 },
  { name: 'favicon-512x512.png', size: 512 }
];

async function generate() {
  console.log('Generating PNG favicons using sharp...');
  for (const { name, size } of sizes) {
    const dest = path.join(publicDir, name);
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(dest);
    console.log(`Generated: ${name} (${size}x${size})`);
  }
  console.log('Favicons generated successfully!');
}

generate().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
