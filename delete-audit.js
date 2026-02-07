const fs = require('fs');
const path = require('path');

const files = [
    'app/api/works/route.ts',
    'app/api/users/validate/route.ts',
    'app/api/users/route.ts',
    'app/api/users/profile/route.ts',
    'app/api/settings/route.ts',
    'app/api/projects/[id]/route.ts',
    'app/api/pdg/notifications-templates/broadcast/route.ts',
    'app/api/pdg/parametres/avance/route.ts',
    'app/api/pdg/matieres/route.ts',
    'app/api/pdg/code-promo/route.ts',
    'app/api/pdg/classes/route.ts',
    'app/api/pdg/categories/route.ts',
    'app/api/projects/route.ts',
    'app/api/partners/route.ts',
    'app/api/messages/route.ts',
    'app/api/disciplines/route.ts',
    'app/api/concepteurs/projects/route.ts',
    'app/api/authors/works/route.ts',
    'app/api/pdg/stock/workflow/route.ts',
    'app/api/pdg/stock/inventory/route.ts',
    'app/api/pdg/stock/corrections/route.ts'
];

let totalFiles = 0;
let totalBlocks = 0;

files.forEach(file => {
    const fullPath = path.join(process.cwd(), file);

    if (!fs.existsSync(fullPath)) {
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    let blockCount = 0;

    // Remove try-catch blocks with only auditLog
    const tryRegex = /\/\/[^\n]*(?:[Cc]réer|[Cc]reate).*?(?:audit|log d'audit)[^\n]*\n\s*try\s*\{[^\}]*await\s+(?:prisma|tx)\.auditLog\.create\([^)]*\)[^\}]*\}\s*catch\s*\([^)]*\)\s*\{[^\}]*\}\s*/g;
    const tryMatches = content.match(tryRegex);
    if (tryMatches) {
        blockCount += tryMatches.length;
        content = content.replace(tryRegex, '\n');
        modified = true;
    }

    // Remove standalone auditLog.create calls  
    const standaloneRegex = /\/\/[^\n]*(?:[Cc]réer|[Cc]reate).*?(?:audit|log d'audit)[^\n]*\n\s*(?:\/\*\s*)?await\s+(?:prisma|tx)\.auditLog\.create\s*\(\{[^}]*\}\s*\)\s*;?\s*(?:\*\/)?/g;
    const standaloneMatches = content.match(standaloneRegex);
    if (standaloneMatches) {
        blockCount += standaloneMatches.length;
        content = content.replace(standaloneRegex, '\n');
        modified = true;
    }

    // Clean up multiple blank lines
    content = content.replace(/\n{3,}/g, '\n\n');

    if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ ${file}: removed ${blockCount} blocks`);
        totalFiles++;
        totalBlocks += blockCount;
    }
});

console.log(`\n✅ Total: ${totalFiles} files, ${totalBlocks} auditLog blocks removed`);
