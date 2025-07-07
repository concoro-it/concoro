#!/usr/bin/env node

/**
 * Image Optimization Script for Concoro
 * Compresses blog images that are currently 2-3MB each
 * 
 * This script will:
 * 1. Convert PNG images to WebP format
 * 2. Compress images to reasonable file sizes
 * 3. Create responsive image variants
 * 
 * Run with: node scripts/optimizeImages.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');

// Target file sizes (in bytes)
const MAX_FILE_SIZE = 100 * 1024; // 100KB max
const WEBP_QUALITY = 80;
const JPEG_QUALITY = 85;

async function checkImageMagickInstalled() {
  try {
    await execAsync('magick -version');
    console.log('✅ ImageMagick is available');
    return true;
  } catch (error) {
    console.log('❌ ImageMagick not found. Please install it:');
    console.log('  macOS: brew install imagemagick');
    console.log('  Ubuntu: sudo apt-get install imagemagick');
    console.log('  Windows: Download from https://imagemagick.org/script/download.php');
    return false;
  }
}

async function optimizeImage(inputPath, outputPath, format = 'webp', quality = 80) {
  try {
    const command = `magick "${inputPath}" -quality ${quality} -strip -resize "800x600>" "${outputPath}"`;
    await execAsync(command);
    
    const stats = fs.statSync(outputPath);
    console.log(`  → ${path.basename(outputPath)}: ${Math.round(stats.size / 1024)}KB`);
    
    return stats.size;
  } catch (error) {
    console.error(`  ❌ Failed to optimize ${inputPath}:`, error.message);
    return null;
  }
}

async function createResponsiveVariants(inputPath, baseName) {
  const variants = [
    { suffix: '-mobile', width: 400, quality: 75 },
    { suffix: '-tablet', width: 600, quality: 80 },
    { suffix: '-desktop', width: 800, quality: 85 }
  ];

  for (const variant of variants) {
    const outputPath = path.join(BLOG_DIR, `${baseName}${variant.suffix}.webp`);
    const command = `magick "${inputPath}" -quality ${variant.quality} -strip -resize "${variant.width}x>" "${outputPath}"`;
    
    try {
      await execAsync(command);
      const stats = fs.statSync(outputPath);
      console.log(`    → ${variant.suffix}: ${Math.round(stats.size / 1024)}KB`);
    } catch (error) {
      console.error(`    ❌ Failed to create ${variant.suffix} variant:`, error.message);
    }
  }
}

async function optimizeBlogImages() {
  console.log('🖼️  Optimizing blog images...\n');

  if (!fs.existsSync(BLOG_DIR)) {
    console.log('❌ Blog directory not found:', BLOG_DIR);
    return;
  }

  const files = fs.readdirSync(BLOG_DIR);
  const imageFiles = files.filter(file => 
    file.toLowerCase().match(/\.(png|jpg|jpeg)$/i) && 
    !file.includes('-mobile') && 
    !file.includes('-tablet') && 
    !file.includes('-desktop')
  );

  console.log(`Found ${imageFiles.length} images to optimize:\n`);

  let totalSavings = 0;
  let processedCount = 0;

  for (const file of imageFiles) {
    const inputPath = path.join(BLOG_DIR, file);
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size;
    
    console.log(`📸 ${file} (${Math.round(originalSize / 1024)}KB)`);

    const baseName = path.parse(file).name;
    
    // Create optimized WebP version
    const webpPath = path.join(BLOG_DIR, `${baseName}.webp`);
    const optimizedSize = await optimizeImage(inputPath, webpPath, 'webp', WEBP_QUALITY);
    
    if (optimizedSize) {
      // Create responsive variants
      await createResponsiveVariants(inputPath, baseName);
      
      const savings = originalSize - optimizedSize;
      totalSavings += savings;
      processedCount++;
      
      console.log(`  💾 Saved: ${Math.round(savings / 1024)}KB (${Math.round(savings/originalSize * 100)}%)`);
    }
    
    console.log('');
  }

  console.log('📊 Optimization Summary:');
  console.log(`  Images processed: ${processedCount}`);
  console.log(`  Total space saved: ${Math.round(totalSavings / 1024 / 1024 * 100) / 100}MB`);
  console.log(`  Average savings per image: ${Math.round(totalSavings / processedCount / 1024)}KB`);
  
  console.log('\n✅ Blog image optimization complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Update your image components to use the new .webp files');
  console.log('2. Implement responsive image loading with the -mobile, -tablet, -desktop variants');
  console.log('3. Add lazy loading to images below the fold');
}

async function optimizeHeroImages() {
  console.log('🎯 Checking hero images...\n');
  
  const heroFiles = ['hero-image.png', 'banner.png'].filter(file => 
    fs.existsSync(path.join(PUBLIC_DIR, file))
  );

  for (const file of heroFiles) {
    const inputPath = path.join(PUBLIC_DIR, file);
    const originalStats = fs.statSync(inputPath);
    
    if (originalStats.size > 50 * 1024) { // If larger than 50KB
      const baseName = path.parse(file).name;
      const webpPath = path.join(PUBLIC_DIR, `${baseName}.webp`);
      
      if (!fs.existsSync(webpPath)) {
        console.log(`📸 Optimizing ${file}...`);
        await optimizeImage(inputPath, webpPath, 'webp', 85);
      } else {
        console.log(`✅ ${baseName}.webp already exists`);
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting Concoro Image Optimization\n');
  
  if (!(await checkImageMagickInstalled())) {
    process.exit(1);
  }

  await optimizeHeroImages();
  await optimizeBlogImages();
  
  console.log('\n🎉 All done! Your mobile PageSpeed score should improve significantly.');
  console.log('💡 Remember to rebuild your Next.js application to see the changes.');
}

// Only run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { optimizeImage, optimizeBlogImages }; 