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
    // ImageMagick is available
    return true;
  } catch (error) {
    // ImageMagick not found
    return false;
  }
}

async function optimizeImage(inputPath, outputPath, format = 'webp', quality = 80) {
  try {
    const command = `magick "${inputPath}" -quality ${quality} -strip -resize "800x600>" "${outputPath}"`;
    await execAsync(command);
    
    const stats = fs.statSync(outputPath);
    // Optimized image created
    
    return stats.size;
  } catch (error) {
    // Failed to optimize image
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
      // Responsive variant created
    } catch (error) {
      // Failed to create responsive variant
    }
  }
}

async function optimizeBlogImages() {
  // Optimizing blog images

  if (!fs.existsSync(BLOG_DIR)) {
    // Blog directory not found
    return;
  }

  const files = fs.readdirSync(BLOG_DIR);
  const imageFiles = files.filter(file => 
    file.toLowerCase().match(/\.(png|jpg|jpeg)$/i) && 
    !file.includes('-mobile') && 
    !file.includes('-tablet') && 
    !file.includes('-desktop')
  );

  // Found images to optimize

  let totalSavings = 0;
  let processedCount = 0;

  for (const file of imageFiles) {
    const inputPath = path.join(BLOG_DIR, file);
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size;
    
    // Processing image file

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
      
      // Image optimization complete
    }
    

  }

  // Blog image optimization complete
}

async function optimizeHeroImages() {
  // Checking hero images
  
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
        // Optimizing hero image
        await optimizeImage(inputPath, webpPath, 'webp', 85);
      } else {
        // WebP version already exists
      }
    }
  }
}

async function main() {
  // Starting image optimization
  
  if (!(await checkImageMagickInstalled())) {
    process.exit(1);
  }

  await optimizeHeroImages();
  await optimizeBlogImages();
  
  // Image optimization completed
}

// Only run if called directly
if (require.main === module) {
  main().catch(() => {});
}

module.exports = { optimizeImage, optimizeBlogImages }; 