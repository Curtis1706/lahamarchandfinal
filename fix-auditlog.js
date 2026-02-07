const fs = require('fs');
const path = require('path');

const filesToFix = [
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

let totalFixed = 0;
let totalOccurrences = 0;

filesToFix.forEach(file => {
    const fullPath = path.join(process.cwd(), file);

    if (!fs.existsSync(fullPath)) {
        console.log(`❌ File not found: ${file}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const beforeCount = (content.match(/await\s+(prisma|tx)\.auditLog\.create\s*\(/g) || []).length;

    if (beforeCount === 0) {
        return;
    }

    // Replace with block comments
    content = content.replace(
        /(\/\/\s*Cr[ée]er\s+(?:un\s+)?(?:log\s+d')?audit[^\n]*\n\s*)(await\s+(?:prisma|tx)\.auditLog\.create\s*\(\{)/g,
        '$1/* $2'
    );

    // Close the block comment at the end of the auditLog.create call
    // Find patterns like });
    content = content.replace(
        /(\/\*\s*await\s+(?:prisma|tx)\.auditLog\.create\s*\(\{[^}]*\}\s*\}\);)/g,
        '$1 */'
    );

    const afterCount = (content.match(/\/\*\s*await\s+(?:prisma|tx)\.auditLog\.create/g) || []).length;

    if (afterCount > 0) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ ${file}: commented ${afterCount} auditLog calls`);
        totalFixed++;
        totalOccurrences += afterCount;
    }
});

console.log(`\n✅ Fixed ${totalFixed} files, ${totalOccurrences} auditLog calls`);
