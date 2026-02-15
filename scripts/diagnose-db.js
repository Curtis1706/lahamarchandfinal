const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Début du diagnostic DB...');

    try {
        // 1. Tester la connexion
        await prisma.$connect();
        console.log('✅ Connexion à la base de données réussie.');

        // 2. Vérifier la table NotificationChain
        const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'NotificationChain';
    `;

        console.log('\n📊 Colonnes de la table NotificationChain :');
        console.table(columns);

        // 3. Vérifier la table Order
        const orderColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Order';
    `;
        console.log('\n📦 Colonnes de la table Order :');
        console.table(orderColumns);

        // 4. Vérifier les types énumérés (si applicables)
        try {
            const enums = await prisma.$queryRaw`
        SELECT t.typname as enum_name, e.enumlabel as enum_value
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        ORDER BY enum_name, enum_value;
      `;
            console.log('\n🏷️ Enums dans la base de données :');
            console.table(enums);
        } catch (e) {
            console.log('ℹ️ Pas pu récupérer les enums ou postgres spécifique.');
        }

    } catch (error) {
        console.error('❌ Erreur lors du diagnostic :', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
