// Icon generation script using sharp
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = path.join(__dirname, '../public/icons/heart-icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🎨 Generating PWA icons...\n');

try {
  // Generate standard icons
  await Promise.all(
    sizes.map(async (size) => {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated icon-${size}x${size}.png`);
    })
  );

  // Generate maskable icons with padding (safe zone)
  console.log('\n🎭 Generating maskable icons...');
  
  await sharp(svgPath)
    .resize(154, 154) // 80% of 192 for safe zone
    .extend({
      top: 19,
      bottom: 19,
      left: 19,
      right: 19,
      background: { r: 253, g: 242, b: 248, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, 'icon-maskable-192x192.png'));
  console.log('✓ Generated icon-maskable-192x192.png');

  await sharp(svgPath)
    .resize(410, 410) // 80% of 512 for safe zone
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 253, g: 242, b: 248, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, 'icon-maskable-512x512.png'));
  console.log('✓ Generated icon-maskable-512x512.png');

  console.log('\n✅ All PWA icons generated successfully!');
  console.log('📱 Your app is now ready to be installed as a PWA\n');
} catch (error) {
  console.error('❌ Error generating icons:', error);
  process.exit(1);
}
