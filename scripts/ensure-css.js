const fs = require('fs');
const path = require('path');

const cssContent = `/* Default stylesheet for Next.js build process */
body {
  margin: 0;
  padding: 0;
}
`;

// Create the file in multiple locations to ensure it's available
const locations = [
  path.join(process.cwd(), '.next', 'browser', 'default-stylesheet.css'),
  path.join(process.cwd(), 'public', 'default-stylesheet.css'),
  path.join(process.cwd(), 'default-stylesheet.css'),
];

locations.forEach(filePath => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, cssContent);
  console.log(`Created default-stylesheet.css at ${filePath}`);
});

// Also create a symlink if possible
try {
  const source = path.join(process.cwd(), 'default-stylesheet.css');
  const target = path.join(
    process.cwd(),
    '.next',
    'browser',
    'default-stylesheet.css'
  );

  if (fs.existsSync(source) && !fs.existsSync(target)) {
    fs.symlinkSync(source, target);
    console.log('Created symlink for default-stylesheet.css');
  }
} catch (error) {
  console.log(
    'Could not create symlink (this is normal on Windows):',
    error.message
  );
}

// Set up a file watcher to recreate the file if it gets deleted
const watchFile = path.join(
  process.cwd(),
  '.next',
  'browser',
  'default-stylesheet.css'
);
if (fs.existsSync(watchFile)) {
  fs.watchFile(watchFile, (curr, prev) => {
    if (!curr.isFile()) {
      console.log('CSS file was deleted, recreating...');
      fs.writeFileSync(watchFile, cssContent);
    }
  });
}
