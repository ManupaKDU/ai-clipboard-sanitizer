const fs = require('fs');
const path = require('path');

const sharedFiles = [
  'rules.js',
  'content.js',
  'background.js',
  'popup.js',
  'popup.html'
];

const sharedDirs = [
  'icons'
];

const targets = ['chrome', 'firefox'];

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} to ${dest}`);
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  console.log(`Copied directory ${src} to ${dest}`);
}

targets.forEach(target => {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target);
  }

  sharedFiles.forEach(file => {
    const src = path.join('src', file);
    const dest = path.join(target, file);
    if (fs.existsSync(src)) {
      copyFile(src, dest);
    } else {
      console.warn(`Warning: Shared file ${src} not found.`);
    }
  });

  sharedDirs.forEach(dir => {
    const src = path.join('src', dir);
    const dest = path.join(target, dir);
    if (fs.existsSync(src)) {
      copyDir(src, dir === 'icons' ? path.join(target, 'icons') : dest);
    } else {
      console.warn(`Warning: Shared directory ${src} not found.`);
    }
  });
});
