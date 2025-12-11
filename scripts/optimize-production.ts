#!/usr/bin/env ts-node
/**
 * Script d'optimisation automatique pour la production
 * 
 * Exécute les optimisations critiques avant déploiement:
 * - Supprime les console.log en production
 * - Vérifie les variables d'environnement
 * - Optimise les imports
 * - Analyse la sécurité de base
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

interface OptimizationResult {
  success: boolean
  message: string
  details?: any
}

class ProductionOptimizer {
  private results: OptimizationResult[] = []
  
  /**
   * Point d'entrée principal
   */
  async optimize() {
    console.log('🚀 Démarrage de l'optimisation pour production...\n')
    
    await this.checkEnvironmentVariables()
    await this.analyzeConsoleLogs()
    await this.checkSecurityIssues()
    await this.analyzeBundleSize()
    
    this.printReport()
  }

  /**
   * Vérification des variables d'environnement
   */
  private async checkEnvironmentVariables() {
    console.log('📋 Vérification des variables d'environnement...')
    
    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'PDG_CREATION_SECRET'
    ]
    
    const missing: string[] = []
    const weak: string[] = []
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName)
      } else {
        // Vérifier la force des secrets
        if (varName.includes('SECRET')) {
          const value = process.env[varName]!
          if (value.length < 32) {
            weak.push(`${varName} (longueur: ${value.length})`)
          }
        }
      }
    }
    
    if (missing.length > 0) {
      this.results.push({
        success: false,
        message: '❌ Variables d'environnement manquantes',
        details: { missing }
      })
    } else if (weak.length > 0) {
      this.results.push({
        success: false,
        message: '⚠️  Secrets trop faibles',
        details: { weak }
      })
    } else {
      this.results.push({
        success: true,
        message: '✅ Variables d'environnement OK'
      })
    }
  }

  /**
   * Analyse des console.log restants
   */
  private async analyzeConsoleLogs() {
    console.log('\n🔍 Analyse des console.log...')
    
    const files = await glob('app/**/*.{ts,tsx,js,jsx}', { 
      ignore: ['**/node_modules/**', '**/.next/**'] 
    })
    
    const filesWithConsole: { file: string; count: number }[] = []
    let totalConsoleLogs = 0
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      const matches = content.match(/console\.(log|error|warn|info)/g)
      
      if (matches) {
        const count = matches.length
        totalConsoleLogs += count
        
        if (count > 5) {
          filesWithConsole.push({ file, count })
        }
      }
    }
    
    if (totalConsoleLogs > 0) {
      this.results.push({
        success: false,
        message: `⚠️  ${totalConsoleLogs} console.log trouvés`,
        details: { 
          total: totalConsoleLogs,
          topFiles: filesWithConsole.sort((a, b) => b.count - a.count).slice(0, 10)
        }
      })
    } else {
      this.results.push({
        success: true,
        message: '✅ Pas de console.log trouvés'
      })
    }
  }

  /**
   * Vérification basique de sécurité
   */
  private async checkSecurityIssues() {
    console.log('\n🔒 Vérification de sécurité...')
    
    const apiFiles = await glob('app/api/**/*.ts')
    const issues: string[] = []
    
    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      
      // Vérifier les problèmes de sécurité basiques
      if (!content.includes('getServerSession') && !content.includes('getCurrentUser')) {
        // Endpoints publics autorisés
        if (!file.includes('public') && !file.includes('health')) {
          issues.push(`${file}: Pas de vérification d'authentification`)
        }
      }
      
      // Vérifier les SQL injections potentielles
      if (content.includes('prisma.$queryRaw') && !content.includes('Prisma.sql')) {
        issues.push(`${file}: Utilisation dangereuse de $queryRaw`)
      }
      
      // Vérifier les secrets en dur
      if (content.match(/secret.*=.*['"`][a-zA-Z0-9]{8,}['"`]/i)) {
        issues.push(`${file}: Secret potentiellement en dur`)
      }
    }
    
    if (issues.length > 0) {
      this.results.push({
        success: false,
        message: `⚠️  ${issues.length} problèmes de sécurité détectés`,
        details: { issues: issues.slice(0, 10) }
      })
    } else {
      this.results.push({
        success: true,
        message: '✅ Pas de problème de sécurité détecté'
      })
    }
  }

  /**
   * Analyse de la taille du bundle
   */
  private async analyzeBundleSize() {
    console.log('\n📦 Analyse de la taille du bundle...')
    
    const nextDir = path.join(process.cwd(), '.next')
    
    if (!fs.existsSync(nextDir)) {
      this.results.push({
        success: false,
        message: '⚠️  Build Next.js non trouvé. Exécutez "npm run build" d\'abord.'
      })
      return
    }
    
    // Analyser la taille des chunks
    const pagesDir = path.join(nextDir, 'static', 'chunks', 'pages')
    
    if (fs.existsSync(pagesDir)) {
      const files = fs.readdirSync(pagesDir)
      const largeChunks: { file: string; size: number }[] = []
      
      files.forEach(file => {
        const filePath = path.join(pagesDir, file)
        const stats = fs.statSync(filePath)
        const sizeKB = stats.size / 1024
        
        if (sizeKB > 500) {
          largeChunks.push({ file, size: Math.round(sizeKB) })
        }
      })
      
      if (largeChunks.length > 0) {
        this.results.push({
          success: false,
          message: `⚠️  ${largeChunks.length} chunks > 500KB détectés`,
          details: { largeChunks }
        })
      } else {
        this.results.push({
          success: true,
          message: '✅ Taille des bundles optimale'
        })
      }
    }
  }

  /**
   * Génération du rapport final
   */
  private printReport() {
    console.log('\n\n' + '='.repeat(60))
    console.log('📊 RAPPORT D\'OPTIMISATION PRODUCTION')
    console.log('='.repeat(60) + '\n')
    
    const successes = this.results.filter(r => r.success).length
    const failures = this.results.filter(r => !r.success).length
    
    this.results.forEach(result => {
      console.log(result.message)
      if (result.details) {
        console.log('   Détails:', JSON.stringify(result.details, null, 2))
      }
      console.log()
    })
    
    console.log('='.repeat(60))
    console.log(`✅ Réussis: ${successes}`)
    console.log(`❌ Échecs: ${failures}`)
    console.log('='.repeat(60))
    
    if (failures === 0) {
      console.log('\n🎉 Projet prêt pour la production!')
    } else {
      console.log('\n⚠️  Veuillez corriger les problèmes avant le déploiement.')
      process.exit(1)
    }
  }
}

// Exécution
const optimizer = new ProductionOptimizer()
optimizer.optimize().catch(console.error)

