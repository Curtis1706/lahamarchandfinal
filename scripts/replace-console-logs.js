const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Trouver tous les fichiers TypeScript dans app/api
const files = glob.sync('app/api/**/*.ts')

let totalModified = 0

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8')
    let modified = false

    // Ajouter import logger si console.log présent
    if (content.includes('console.log') || content.includes('console.error') || content.includes('console.warn')) {
        if (!content.includes("import { logger }")) {
            content = `import { logger } from '@/lib/logger'\n` + content
            modified = true
        }
    }

    // Remplacer console.log par logger.debug (désactivé en prod)
    if (content.includes('console.log')) {
        content = content.replace(/console\.log\(/g, 'logger.debug(')
        modified = true
    }

    // Remplacer console.error par logger.error
    if (content.includes('console.error')) {
        content = content.replace(/console\.error\(/g, 'logger.error(')
        modified = true
    }

    // Remplacer console.warn par logger.warn
    if (content.includes('console.warn')) {
        content = content.replace(/console\.warn\(/g, 'logger.warn(')
        modified = true
    }

    if (modified) {
        fs.writeFileSync(file, content)
        console.log(`✅ Modifié: ${file}`)
        totalModified++
    }
})

console.log(`\n✅ Remplacement terminé!`)
console.log(`📊 ${totalModified} fichiers modifiés`)
