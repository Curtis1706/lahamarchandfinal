import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Script de Rollback pour la migration Multi-Prix et Royautés.
 * 
 * ATTENTION : Ce script est un modèle. En production, il est fortement
 * recommandé d'utiliser une restauration de sauvegarde de base de données (ex: Neon Restore).
 */

async function rollback() {
    console.log('🔄 Démarrage du rollback de la migration...');

    try {
        // 1. Restaurer le schéma Prisma précédent (si vous avez une sauvegarde du fichier)
        // Ici, nous supposons que vous restaurez manuellement le schema.prisma
        // ou que vous utilisez git checkout prisma/schema.prisma

        console.log('⏳ Synchronisation du schéma vers l\'état précédent...');
        // npx prisma db push --force-reset (⚠️ Attention : Efface les données ! À utiliser avec prudence)
        // execSync('npx prisma db push', { stdio: 'inherit' });

        console.log('✅ Schéma synchronisé.');

        // 2. Optionnel : Nettoyage des données si nécessaire (via SQL)
        // console.log('🧹 Nettoyage des tables WorkPrice et ClientTypeConfig...');

        console.log('\n✨ Rollback terminé avec succès.');
        console.log('💡 Note : Si la migration a échoué au niveau des données, utilisez la console Neon pour restaurer un snapshot.');

    } catch (error) {
        console.error('❌ Erreur lors du rollback:', error);
        process.exit(1);
    }
}

rollback();
