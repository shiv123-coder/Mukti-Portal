const fs = require('fs');
const path = require('path');

const replaceInFiles = (dir, patternMap) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      replaceInFiles(fullPath, patternMap);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let changed = false;
      
      for (const [pattern, replacement] of patternMap) {
        if (content.match(pattern)) {
          content = content.replace(pattern, replacement);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
};

const adminPatternMap = [
  // Destructive (Red)
  [/bg-red-500\/10/g, 'bg-destructive/10'],
  [/border-red-500\/20/g, 'border-destructive/20'],
  [/border-red-500\/30/g, 'border-destructive/30'],
  [/border-red-500/g, 'border-destructive'],
  [/text-red-500/g, 'text-destructive'],
  [/bg-red-500/g, 'bg-destructive'],
  [/bg-red-600/g, 'bg-destructive'],
  [/text-red-400/g, 'text-destructive-foreground'],
  [/bg-red-800/g, 'bg-destructive'],
  
  // Success (Emerald/Green)
  [/bg-emerald-500\/10/g, 'bg-success/10'],
  [/bg-emerald-500\/5/g, 'bg-success/10'],
  [/border-emerald-500\/20/g, 'border-success/20'],
  [/border-emerald-500\/10/g, 'border-success/20'],
  [/border-emerald-500/g, 'border-success'],
  [/text-emerald-500/g, 'text-success'],
  [/bg-emerald-500/g, 'bg-success'],
  [/text-emerald-400/g, 'text-success-foreground'],
  [/bg-emerald-600\/10/g, 'bg-success/10'],
  [/bg-emerald-600/g, 'bg-success'],
  [/bg-emerald-700/g, 'bg-success'],
  [/text-emerald-600/g, 'text-success'],
  
  // Warning (Yellow/Orange)
  [/bg-yellow-500\/10/g, 'bg-warning/10'],
  [/border-yellow-500\/20/g, 'border-warning/20'],
  [/border-yellow-500/g, 'border-warning'],
  [/text-yellow-500/g, 'text-warning'],
  [/bg-yellow-500/g, 'bg-warning'],
  [/text-yellow-600/g, 'text-warning'],
  [/text-yellow-400/g, 'text-warning'],
  
  // Other Hardcoded
  [/border-white/g, 'border-primary-foreground'],
  [/text-black/g, 'text-foreground']
];

console.log("Running refactor script...");
replaceInFiles(path.join(__dirname, 'src', 'pages', 'admin'), adminPatternMap);

// Also running on Customer and Worker and general pages for the exact replacements requested.
// This is safer since we define patterns strictly based on the plan.
const globalPatternMap = [
  ...adminPatternMap,
  // Specific Report & Analytics requested replacements
  [/bg-orange-50\/50/g, 'bg-muted/50'],
  [/bg-black\/50 text-white/g, 'bg-background/60 text-foreground'],
  [/bg-black\/40 text-white/g, 'bg-background/80 text-foreground']
];

replaceInFiles(path.join(__dirname, 'src', 'pages'), globalPatternMap);
console.log("Done.");
