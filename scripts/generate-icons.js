const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Use brand icon from assets
const BRAND_ICON = path.join(__dirname, '..', 'assets', 'branding', 'icons', 'icon-blk-bg.png');
const BUILD_DIR = path.join(__dirname, '..', 'build');
const SIZES = [16, 24, 32, 48, 64, 128, 256, 512];

async function generateIcons() {
  // Ensure build directory exists
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }

  // Check if brand icon exists
  if (!fs.existsSync(BRAND_ICON)) {
    console.error('Brand icon not found:', BRAND_ICON);
    console.log('Please ensure assets/branding/icons/icon-blk-bg.png exists');
    process.exit(1);
  }

  console.log('Using brand icon:', BRAND_ICON);
  console.log('Generating PNG icons...');
  
  for (const size of SIZES) {
    const pngBuffer = await sharp(BRAND_ICON)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .png()
      .toBuffer();
    
    const pngPath = path.join(BUILD_DIR, `icon-${size}.png`);
    fs.writeFileSync(pngPath, pngBuffer);
    console.log(`  Created: icon-${size}.png`);
  }

  // Create main icon.png (512x512 for high DPI)
  const mainPng = await sharp(BRAND_ICON)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BUILD_DIR, 'icon.png'), mainPng);
  console.log('  Created: icon.png (512x512)');

  // Create ICO file for Windows using png-to-ico
  console.log('Generating ICO file...');
  try {
    const pngToIco = require('png-to-ico');
    
    // Use sizes appropriate for ICO (Windows uses 16, 24, 32, 48, 64, 128, 256)
    const icoSizes = [16, 24, 32, 48, 64, 128, 256];
    const pngPaths = icoSizes.map(size => path.join(BUILD_DIR, `icon-${size}.png`));
    
    const icoBuffer = await pngToIco(pngPaths);
    fs.writeFileSync(path.join(BUILD_DIR, 'icon.ico'), icoBuffer);
    console.log('  Created: icon.ico');
  } catch (err) {
    console.log('  Note: ICO creation with png-to-ico failed, using manual method');
    console.log('  Error:', err.message);
    
    // Create a simple ICO header manually (256x256 PNG embedded)
    const pngData = fs.readFileSync(path.join(BUILD_DIR, 'icon-256.png'));
    
    // ICO header
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // Reserved
    header.writeUInt16LE(1, 2); // Type (1 = ICO)
    header.writeUInt16LE(1, 4); // Number of images
    
    // Image entry
    const entry = Buffer.alloc(16);
    entry.writeUInt8(0, 0);  // Width (0 = 256)
    entry.writeUInt8(0, 1);  // Height (0 = 256)
    entry.writeUInt8(0, 2);  // Color palette
    entry.writeUInt8(0, 3);  // Reserved
    entry.writeUInt16LE(1, 4);  // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(pngData.length, 8); // Size of image data
    entry.writeUInt32LE(22, 12); // Offset to image data (6 + 16 = 22)
    
    const ico = Buffer.concat([header, entry, pngData]);
    fs.writeFileSync(path.join(BUILD_DIR, 'icon.ico'), ico);
    console.log('  Created: icon.ico (manual method)');
  }

  // Copy logo to public folder for app use
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const logoSrc = path.join(__dirname, '..', 'assets', 'branding', 'logos', 'focule-logo-trans-bg.png');
  if (fs.existsSync(logoSrc)) {
    // Create optimized logo for web (height: 48px)
    await sharp(logoSrc)
      .resize(null, 48, { fit: 'contain' })
      .png()
      .toFile(path.join(publicDir, 'logo.png'));
    console.log('  Created: public/logo.png (header logo)');
    
    // Also create a larger version for splash/about
    await sharp(logoSrc)
      .resize(null, 120, { fit: 'contain' })
      .png()
      .toFile(path.join(publicDir, 'logo-large.png'));
    console.log('  Created: public/logo-large.png');
  }

  console.log('\nDone! Icons saved to:', BUILD_DIR);
}

generateIcons().catch(console.error);
