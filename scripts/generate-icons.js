const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

async function generateIcons() {
  const inputPath = path.join(__dirname, '../public/FM-Tracker-Logo.png');
  const outputDir = path.join(__dirname, '../public/icons');

  // Create icons directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating PWA icons from FM-Tracker-Logo.png...');

  for (const icon of sizes) {
    const outputPath = path.join(outputDir, icon.name);
    
    try {
      await sharp(inputPath)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${icon.name}:`, error);
    }
  }

  console.log('\nAll PWA icons generated successfully!');
}

generateIcons().catch(console.error);