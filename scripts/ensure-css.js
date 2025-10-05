const fs = require('fs');
const path = require('path');

// Ensure the .next/browser directory exists
const browserDir = path.join(process.cwd(), '.next', 'browser');
if (!fs.existsSync(browserDir)) {
  fs.mkdirSync(browserDir, { recursive: true });
}

// Create the default-stylesheet.css file
const cssFile = path.join(browserDir, 'default-stylesheet.css');
const cssContent = '/* Default stylesheet for Next.js build process */\n';

fs.writeFileSync(cssFile, cssContent);
console.log('Created default-stylesheet.css for build process');
