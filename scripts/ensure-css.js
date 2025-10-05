const fs = require('fs');
const path = require('path');

// Ensure the .next/browser directory exists
const browserDir = path.join(process.cwd(), '.next', 'browser');
if (!fs.existsSync(browserDir)) {
  fs.mkdirSync(browserDir, { recursive: true });
}

// Create the default-stylesheet.css file
const cssFile = path.join(browserDir, 'default-stylesheet.css');
const cssContent = `/* Default stylesheet for Next.js build process */
body {
  margin: 0;
  padding: 0;
}
`;

fs.writeFileSync(cssFile, cssContent);
console.log('Created default-stylesheet.css for build process');

// Also create it in the public directory as a backup
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const publicCssFile = path.join(publicDir, 'default-stylesheet.css');
fs.writeFileSync(publicCssFile, cssContent);
console.log('Created backup default-stylesheet.css in public directory');
