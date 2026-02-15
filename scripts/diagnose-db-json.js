const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const report = {
        timestamp: new Date().toISOString(),
        connection: false,
        tables: {},
        errors: []
    };

    try {
        await prisma.$connect();
        report.connection = true;

        const tables = ['NotificationChain', 'Order', 'User', 'Client'];

        for (const table of tables) {
            try {
                const columns = await prisma.$queryRawUnsafe(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = '${table}';
        `);
                report.tables[table] = columns;
            } catch (e) {
                report.errors.push(`Table ${table}: ${e.message}`);
            }
        }

    } catch (error) {
        report.errors.push(`Critical: ${error.message}`);
    } finally {
        fs.writeFileSync('prisma-diag.json', JSON.stringify(report, null, 2));
        await prisma.$disconnect();
        console.log('✅ Diagnostic écrit dans prisma-diag.json');
    }
}

main();
