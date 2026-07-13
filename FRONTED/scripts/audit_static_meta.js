import fs from 'fs';
import path from 'path';

const pagesDir = 'src/pages';

function getFiles(dir) {
  const subdirs = fs.readdirSync(dir);
  const files = subdirs.map(subdir => {
    const res = path.resolve(dir, subdir);
    return fs.statSync(res).isDirectory() ? getFiles(res) : res;
  });
  return files.flat();
}

const astroFiles = getFiles(pagesDir).filter(f => f.endsWith('.astro'));

console.log(`Auditing ${astroFiles.length} Astro page files...`);

const missingMeta = [];

astroFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Skip dynamic route templates since they retrieve metadata dynamically
  if (file.includes('[slug].astro')) {
    return;
  }
  
  const relPath = path.relative(pagesDir, file);
  
  // Find <BaseLayout usage
  const baseLayoutMatch = content.includes('BaseLayout');
  if (!baseLayoutMatch) {
    return;
  }
  
  // Let's check if 'description=' exists inside the file
  const hasDescription = content.match(/description\s*=\s*["'{]/);
  
  if (!hasDescription) {
    missingMeta.push({
      file: relPath,
      reason: 'No description attribute found on BaseLayout'
    });
  } else {
    // Check if it's empty
    const emptyDesc = content.match(/description\s*=\s*["']\s*["']/);
    if (emptyDesc) {
      missingMeta.push({
        file: relPath,
        reason: 'Empty description attribute'
      });
    }
  }
  
  // Also check title
  const hasTitle = content.match(/title\s*=\s*["'{]/);
  if (!hasTitle) {
    missingMeta.push({
      file: relPath,
      reason: 'No title attribute found on BaseLayout'
    });
  }
});

if (missingMeta.length === 0) {
  console.log("All static Astro pages have a title and description passed to BaseLayout!");
} else {
  console.log("Found static pages missing description or title:");
  missingMeta.forEach(m => {
    console.log(`- ${m.file}: ${m.reason}`);
  });
}
