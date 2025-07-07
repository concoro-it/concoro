const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

// File extensions to process
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Regex to match console.log statements
// This handles multi-line console.log statements as well
const CONSOLE_LOG_REGEX = /console\.log\s*\(\s*(?:[^)(]|\([^)(]*\))*\s*\)\s*;?/g;

// Directories to skip
const SKIP_DIRS = ['node_modules', '.git', '.next', 'out', 'build', 'dist'];

async function processFile(filePath) {
  try {
    const content = await readFileAsync(filePath, 'utf8');
    
    // Check if file contains console.log
    if (!content.includes('console.log')) {
      return { filePath, modified: false };
    }
    
    // Replace console.log statements
    const newContent = content.replace(CONSOLE_LOG_REGEX, '');
    
    // Only write if content changed
    if (content !== newContent) {
      await writeFileAsync(filePath, newContent, 'utf8');
      return { filePath, modified: true };
    }
    
    return { filePath, modified: false };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return { filePath, error };
  }
}

async function walkDir(dir) {
  let results = [];
  const entries = await readdirAsync(dir);
  
  for (const entry of entries) {
    if (SKIP_DIRS.includes(entry)) continue;
    
    const fullPath = path.join(dir, entry);
    const stat = await statAsync(fullPath);
    
    if (stat.isDirectory()) {
      const subResults = await walkDir(fullPath);
      results = results.concat(subResults);
    } else if (stat.isFile() && EXTENSIONS.includes(path.extname(fullPath))) {
      results.push(fullPath);
    }
  }
  
  return results;
}

async function main() {
  try {
    // Start from the src directory
    const srcDir = path.join(process.cwd(), 'src');
    console.log(`Scanning for files in ${srcDir}...`);
    
    const files = await walkDir(srcDir);
    console.log(`Found ${files.length} files to process`);
    
    const results = [];
    let modifiedCount = 0;
    
    for (const file of files) {
      const result = await processFile(file);
      results.push(result);
      
      if (result.modified) {
        modifiedCount++;
        console.log(`Removed console.log from: ${result.filePath}`);
      }
    }
    
    console.log(`\nSummary: Removed console.log statements from ${modifiedCount} files`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 