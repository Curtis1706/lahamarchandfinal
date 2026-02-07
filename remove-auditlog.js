const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all .ts files in app/api
const files = glob.sync('app/api/**/*.ts', { cwd: process.cwd() });

let totalFiles = 0;
let totalRemoved = 0;

files.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Pattern to match auditLog.create blocks with their surrounding try-catch or standalone
    // This regex matches from the comment to the closing });
    const patterns = [
        // Pattern 1: Match try-catch blocks containing only auditLog
        /\s*\/\/[^\n]*audit[^\n]*\n\s*try\s*\{[^}]*await\s+(?:prisma|tx)\.auditLog\.create\s*\([^)]*\)[^}]*\}\s*catch[^}]*\{[^}]*\}\s*/gi,

        // Pattern 2: Match standalone auditLog.create with comment
        /\s*\/\/[^\n]*(?:audit|log d'audit)[^\n]*\n\s*await\s+(?:prisma|tx)\.auditLog\.create\s*\(\{(?:[^{}]|\{[^{}]*\})*\}\s*\)\s*;?\s*/gi,

        // Pattern 3: Match auditLog.create inside try blocks (without the try-catch)
        /\s*await\s+(?:prisma|tx)\.auditLog\.create\s*\(\{(?:[^{}]|\{[^{}]*\})*\}\s*\)\s*;?\s*/gi,
    ];

    let modified = false;
    let removeCount = 0;

    patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
            removeCount += matches.length;
            content = content.replace(pattern, '\n');
            modified = true;
        }
    });

    // Clean up multiple consecutive blank lines
    content = content.replace(/\n{3,}/g, '\n\n');

    if (modified && content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ ${file}: removed ${removeCount} auditLog blocks`);
        totalFiles++;
        totalRemoved += removeCount;
    }
});

console.log(`\n========================================`);
console.log(`✅ Total: ${totalFiles} files modified`);
console.log(`✅ Total: ${totalRemoved} auditLog blocks removed`);
console.log(`========================================\n`);
