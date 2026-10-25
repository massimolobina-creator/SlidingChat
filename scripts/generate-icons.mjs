import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const rootDir = process.cwd();
const logoSource = path.join(rootDir, 'src', 'assets', 'images', 'logo_1783246563222.jpg');

if (!fs.existsSync(logoSource)) {
  console.error('Logo source file not found:', logoSource);
  process.exit(1);
}

const args = process.argv.slice(2);
const generateWeb = args.includes('--web');
const generateAndroid = args.includes('--android');

async function buildWebIcons() {
  const publicDir = path.join(rootDir, 'public');
  fs.mkdirSync(publicDir, { recursive: true });

  const webTargets = [
    { file: 'favicon.png', size: 192 },
    { file: 'icon-192.png', size: 192 },
    { file: 'icon-512.png', size: 512 },
    { file: 'logo.png', size: 512 },
  ];

  for (const target of webTargets) {
    const outPath = path.join(publicDir, target.file);
    await sharp(logoSource)
      .resize(target.size, target.size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(outPath);
    console.log(`Generated web icon: ${outPath} (${target.size}x${target.size})`);
  }
}

async function buildAndroidIcons() {
  const resDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');
  if (!fs.existsSync(resDir)) {
    console.error('Android res directory not found:', resDir);
    process.exit(1);
  }

  // 1. Remove default Capacitor vector drawables that override or conflict with custom launcher icons
  const obsoleteDrawables = [
    path.join(resDir, 'drawable', 'ic_launcher_background.xml'),
    path.join(resDir, 'drawable-v24', 'ic_launcher_foreground.xml'),
    path.join(resDir, 'drawable', 'ic_launcher_foreground.xml'),
  ];
  for (const file of obsoleteDrawables) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log('Removed default Capacitor vector drawable:', file);
    }
  }

  // 2. Ensure values/ic_launcher_background.xml sets a clean white background
  const valuesDir = path.join(resDir, 'values');
  fs.mkdirSync(valuesDir, { recursive: true });
  fs.writeFileSync(
    path.join(valuesDir, 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FFFFFF</color>\n</resources>\n`,
    'utf8'
  );

  // 3. Ensure mipmap-anydpi-v26 adaptive icon XMLs point to @color/ic_launcher_background and @mipmap/ic_launcher_foreground
  const anyDpiDir = path.join(resDir, 'mipmap-anydpi-v26');
  fs.mkdirSync(anyDpiDir, { recursive: true });
  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  fs.writeFileSync(path.join(anyDpiDir, 'ic_launcher.xml'), adaptiveXml, 'utf8');
  fs.writeFileSync(path.join(anyDpiDir, 'ic_launcher_round.xml'), adaptiveXml, 'utf8');

  // 4. Generate density-specific PNG icons for every Android mipmap folder
  const densities = [
    { dir: 'mipmap-mdpi', legacy: 48, adaptive: 108 },
    { dir: 'mipmap-hdpi', legacy: 72, adaptive: 162 },
    { dir: 'mipmap-xhdpi', legacy: 96, adaptive: 216 },
    { dir: 'mipmap-xxhdpi', legacy: 144, adaptive: 324 },
    { dir: 'mipmap-xxxhdpi', legacy: 192, adaptive: 432 },
  ];

  for (const d of densities) {
    const dirPath = path.join(resDir, d.dir);
    fs.mkdirSync(dirPath, { recursive: true });

    // Remove any .webp launcher icons if present so .png is unconditionally used
    for (const existing of fs.readdirSync(dirPath)) {
      if (existing.endsWith('.webp')) {
        fs.unlinkSync(path.join(dirPath, existing));
      }
    }

    // Standard legacy icon (square with slight padding on white)
    const legacyInner = Math.round(d.legacy * 0.84);
    const legacyPad = Math.floor((d.legacy - legacyInner) / 2);
    const legacyRemainder = d.legacy - legacyInner - legacyPad;

    await sharp(logoSource)
      .resize(legacyInner, legacyInner, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .extend({
        top: legacyPad,
        bottom: legacyRemainder,
        left: legacyPad,
        right: legacyRemainder,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(path.join(dirPath, 'ic_launcher.png'));

    // Round legacy icon (circular mask with transparent corners)
    const roundInner = Math.round(d.legacy * 0.76);
    const roundPad = Math.floor((d.legacy - roundInner) / 2);
    const roundRemainder = d.legacy - roundInner - roundPad;
    const circleSvg = Buffer.from(
      `<svg width="${d.legacy}" height="${d.legacy}"><circle cx="${d.legacy / 2}" cy="${d.legacy / 2}" r="${d.legacy / 2}" fill="white"/></svg>`
    );

    const paddedSquareBuffer = await sharp(logoSource)
      .resize(roundInner, roundInner, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .extend({
        top: roundPad,
        bottom: roundRemainder,
        left: roundPad,
        right: roundRemainder,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toBuffer();

    await sharp(paddedSquareBuffer)
      .ensureAlpha()
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .png()
      .toFile(path.join(dirPath, 'ic_launcher_round.png'));

    // Adaptive icon foreground (inner 64% safe zone centered on 108dp canvas)
    const fgInner = Math.round(d.adaptive * 0.64);
    const fgPad = Math.floor((d.adaptive - fgInner) / 2);
    const fgRemainder = d.adaptive - fgInner - fgPad;

    await sharp(logoSource)
      .resize(fgInner, fgInner, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .extend({
        top: fgPad,
        bottom: fgRemainder,
        left: fgPad,
        right: fgRemainder,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .ensureAlpha()
      .png()
      .toFile(path.join(dirPath, 'ic_launcher_foreground.png'));

    // Adaptive icon background (solid white)
    await sharp({
      create: {
        width: d.adaptive,
        height: d.adaptive,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toFile(path.join(dirPath, 'ic_launcher_background.png'));

    console.log(`Generated Android mipmap icons in ${d.dir}`);
  }

  // 5. Update all splash.png files in drawable* directories with the SlidingChat logo
  const resEntries = fs.readdirSync(resDir, { withFileTypes: true });
  for (const entry of resEntries) {
    if (entry.isDirectory() && entry.name.startsWith('drawable')) {
      const splashPath = path.join(resDir, entry.name, 'splash.png');
      if (fs.existsSync(splashPath)) {
        await sharp(logoSource)
          .resize(320, 320, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .extend({
            top: 240,
            bottom: 240,
            left: 240,
            right: 240,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          })
          .png()
          .toFile(splashPath);
        console.log(`Updated splash screen: ${splashPath}`);
      }
    }
  }
}

(async () => {
  if (generateWeb) {
    await buildWebIcons();
  }
  if (generateAndroid) {
    await buildAndroidIcons();
  }
})();
