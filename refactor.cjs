const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles(srcDir);

const replacements = [
  // Complex shadows
  { regex: /shadow-\[0_0_[0-9]+px_rgba\([^\)]+\)\]/g, replacement: 'shadow-primary-glow' },
  { regex: /shadow-orange-[0-9]{3}\/[0-9]{2}/g, replacement: 'shadow-primary-glow' },
  { regex: /shadow-amber-[0-9]{3}\/[0-9]{2}/g, replacement: 'shadow-primary-glow' },
  { regex: /shadow-yellow-[0-9]{3}\/[0-9]{2}/g, replacement: 'shadow-primary-glow' },

  // Gradients
  { regex: /bg-gradient-to-[a-z]+\s+from-orange-[0-9]{3}\s+to-orange-[0-9]{3}/g, replacement: 'bg-gradient-primary' },
  { regex: /bg-gradient-to-[a-z]+\s+from-amber-[0-9]{3}\s+to-amber-[0-9]{3}/g, replacement: 'bg-gradient-primary' },
  { regex: /bg-gradient-to-[a-z]+\s+from-yellow-[0-9]{3}\s+to-orange-[0-9]{3}/g, replacement: 'bg-gradient-primary' },
  { regex: /from-orange-[0-9]{3}/g, replacement: 'from-primary' },
  { regex: /to-orange-[0-9]{3}/g, replacement: 'to-indigo-600' },
  { regex: /via-orange-[0-9]{3}/g, replacement: 'via-indigo-500' },

  // Text colors
  { regex: /text-orange-[0-9]{3}/g, replacement: 'text-primary' },
  { regex: /text-amber-[0-9]{3}/g, replacement: 'text-primary' },

  // Background colors
  { regex: /bg-orange-[0-9]{3}\/[0-9]{2}/g, replacement: 'bg-primary/20' },
  { regex: /bg-orange-[0-9]{3}/g, replacement: 'bg-primary' },
  { regex: /bg-amber-[0-9]{3}\/[0-9]{2}/g, replacement: 'bg-primary/20' },
  { regex: /bg-amber-[0-9]{3}/g, replacement: 'bg-primary' },

  // Border colors
  { regex: /border-orange-[0-9]{3}\/[0-9]{2}/g, replacement: 'border-primary/20' },
  { regex: /border-orange-[0-9]{3}/g, replacement: 'border-primary' },

  // Fill colors (SVG)
  { regex: /fill-orange-[0-9]{3}/g, replacement: 'fill-primary' }
];

let filesModified = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Modified: ${file}`);
    filesModified++;
  }
});

console.log(`\nFinished refactoring colors in ${filesModified} files.`);
