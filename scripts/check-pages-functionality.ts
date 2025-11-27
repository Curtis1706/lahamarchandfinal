/**
 * Script pour vérifier la fonctionnalité des pages
 * Analyse chaque page pour détecter si elle charge des données, a des API connectées, etc.
 */

import fs from 'fs'
import path from 'path'

interface PageAnalysis {
  path: string
  hasUseEffect: boolean
  hasApiCall: boolean
  hasLoadData: boolean
  hasState: boolean
  isFunctional: boolean
  issues: string[]
}

const dashboardPath = path.join(process.cwd(), 'app/dashboard')

function analyzePage(filePath: string): PageAnalysis {
  const content = fs.readFileSync(filePath, 'utf-8')
  
  const analysis: PageAnalysis = {
    path: filePath.replace(process.cwd(), '').replace(/\\/g, '/'),
    hasUseEffect: /useEffect/i.test(content),
    hasApiCall: /fetch|apiClient|axios/i.test(content),
    hasLoadData: /loadData|fetchData|load.*Data/i.test(content),
    hasState: /useState/i.test(content),
    isFunctional: false,
    issues: []
  }

  // Vérifier si la page est fonctionnelle
  if (!analysis.hasUseEffect && !analysis.hasApiCall && !analysis.hasLoadData) {
    analysis.issues.push('Pas de chargement de données détecté')
  }

  if (analysis.hasUseEffect && !analysis.hasApiCall && !analysis.hasLoadData) {
    analysis.issues.push('useEffect présent mais pas d\'appel API')
  }

  // Vérifier si c'est juste un placeholder
  if (/Aucune donnée|Chargement|placeholder|TODO|FIXME/i.test(content) && !analysis.hasApiCall) {
    analysis.issues.push('Contenu placeholder sans fonctionnalité')
  }

  analysis.isFunctional = analysis.hasApiCall || (analysis.hasLoadData && analysis.hasUseEffect)

  return analysis
}

function getAllPages(dir: string, role: string): string[] {
  const pages: string[] = []
  
  function traverse(currentDir: string) {
    const files = fs.readdirSync(currentDir)
    
    for (const file of files) {
      const filePath = path.join(currentDir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        traverse(filePath)
      } else if (file === 'page.tsx' || file === 'page.ts') {
        pages.push(filePath)
      }
    }
  }
  
  traverse(dir)
  return pages
}

function checkRole(role: string) {
  const rolePath = path.join(dashboardPath, role)
  
  if (!fs.existsSync(rolePath)) {
    return []
  }

  const pages = getAllPages(rolePath, role)
  return pages.map(analyzePage)
}

// Rôles à vérifier
const roles = ['pdg', 'auteur', 'concepteur', 'partenaire', 'representant', 'client']

const results: Record<string, PageAnalysis[]> = {}

for (const role of roles) {
  results[role] = checkRole(role)
}

// Générer le rapport
let report = '# Rapport de vérification des pages\n\n'
report += `Date: ${new Date().toLocaleString('fr-FR')}\n\n`

for (const role of roles) {
  const pages = results[role]
  const functional = pages.filter(p => p.isFunctional).length
  const nonFunctional = pages.filter(p => !p.isFunctional).length
  
  report += `## Rôle: ${role.toUpperCase()}\n\n`
  report += `- Total pages: ${pages.length}\n`
  report += `- Pages fonctionnelles: ${functional}\n`
  report += `- Pages non fonctionnelles: ${nonFunctional}\n\n`
  
  if (nonFunctional > 0) {
    report += `### Pages non fonctionnelles:\n\n`
    pages.filter(p => !p.isFunctional).forEach(page => {
      report += `- **${page.path}**\n`
      if (page.issues.length > 0) {
        report += `  - Problèmes: ${page.issues.join(', ')}\n`
      }
      report += `\n`
    })
  }
  
  report += `\n`
}

// Sauvegarder le rapport
fs.writeFileSync(path.join(process.cwd(), 'PAGES-FUNCTIONALITY-REPORT.md'), report)
console.log('Rapport généré: PAGES-FUNCTIONALITY-REPORT.md')

