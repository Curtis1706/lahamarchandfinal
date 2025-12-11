/**
 * Script d'optimisation automatique du code
 * Usage: npx ts-node scripts/optimize-code.ts
 */

import fs from 'fs'
import path from 'path'

interface OptimizationReport {
  filesScanned: number
  issuesFound: number
  issuesFixed: number
  errors: string[]
}

const report: OptimizationReport = {
  filesScanned: 0,
  issuesFound: 0,
  issuesFixed: 0,
  errors: []
}

// Liste des patterns à remplacer
const replacements = [
  {
    name: 'Console.log conditionnel',
    pattern: /console\.log\((.*?)\)/g,
    replacement: (match: string, content: string) => {
      return `if (process.env.NODE_ENV === 'development') console.log(${content})`
    },
    shouldReplace: (filePath: string) => filePath.includes('/api/')
  },
  {
    name: 'Error any vers Error',
    pattern: /catch\s*\(\s*error:\s*any\s*\)/g,
    replacement: () => 'catch (error: unknown)',
    shouldReplace: () => true
  }
]

function scanDirectory(dir: string): string[] {
  const files: string[] = []
  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      // Ignorer certains dossiers
      if (['node_modules', '.next', '.git', 'prisma'].includes(item)) {
        continue
      }
      files.push(...scanDirectory(fullPath))
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      files.push(fullPath)
    }
  }

  return files
}

function optimizeFile(filePath: string): boolean {
  try {
    report.filesScanned++
    let content = fs.readFileSync(filePath, 'utf-8')
    let modified = false

    for (const replacement of replacements) {
      if (!replacement.shouldReplace(filePath)) continue

      const matches = content.match(replacement.pattern)
      if (matches && matches.length > 0) {
        report.issuesFound += matches.length
        content = content.replace(replacement.pattern, replacement.replacement as any)
        modified = true
        console.log(`  ✓ Fixed ${matches.length} occurrence(s) of "${replacement.name}" in ${path.basename(filePath)}`)
      }
    }

    if (modified) {
      // Backup avant modification
      fs.writeFileSync(filePath + '.backup', fs.readFileSync(filePath))
      fs.writeFileSync(filePath, content, 'utf-8')
      report.issuesFixed++
      return true
    }

    return false
  } catch (error) {
    report.errors.push(`Error processing ${filePath}: ${error}`)
    return false
  }
}

function main() {
  console.log('🔍 Starting code optimization...\n')

  const rootDir = process.cwd()
  const appDir = path.join(rootDir, 'app')

  console.log('📁 Scanning files...')
  const files = scanDirectory(appDir)

  console.log(`\n📊 Found ${files.length} TypeScript files\n`)
  console.log('🔧 Optimizing...\n')

  for (const file of files) {
    optimizeFile(file)
  }

  console.log('\n' + '='.repeat(50))
  console.log('📈 OPTIMIZATION REPORT')
  console.log('='.repeat(50))
  console.log(`Files scanned:    ${report.filesScanned}`)
  console.log(`Issues found:     ${report.issuesFound}`)
  console.log(`Issues fixed:     ${report.issuesFixed}`)
  console.log(`Errors:           ${report.errors.length}`)

  if (report.errors.length > 0) {
    console.log('\n❌ Errors:')
    report.errors.forEach(error => console.log(`  - ${error}`))
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ Optimization complete!')
  console.log('\n💡 Tip: Backup files created with .backup extension')
  console.log('💡 To remove backups: npm run clean:backups')
}

// Exécuter si appelé directement
if (require.main === module) {
  main()
}

export { optimizeFile, scanDirectory }

