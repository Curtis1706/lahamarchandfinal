const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║           LISTE DES UTILISATEURS - LAHA MARCHAND              ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');

        if (users.length === 0) {
            console.log('❌ Aucun utilisateur trouvé dans la base de données.\n');
        } else {
            users.forEach((user, index) => {
                console.log(`┌─ Utilisateur #${index + 1} ─────────────────────────────────────────`);
                console.log(`│ 👤 Nom       : ${user.name}`);
                console.log(`│ 📧 Email     : ${user.email}`);
                console.log(`│ 📱 Téléphone : ${user.phone || '❌ Non renseigné'}`);
                console.log(`│ 🎭 Rôle      : ${user.role}`);
                console.log(`│ ⚡ Statut    : ${user.status}`);
                console.log('└────────────────────────────────────────────────────────────────\n');
            });

            console.log(`📊 Total : ${users.length} utilisateur(s)\n`);

            // Statistiques par rôle
            const roleStats = users.reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            }, {});

            console.log('📈 Répartition par rôle :');
            Object.entries(roleStats).forEach(([role, count]) => {
                console.log(`   • ${role}: ${count}`);
            });
            console.log('');

            // Utilisateurs sans téléphone
            const usersWithoutPhone = users.filter(u => !u.phone);
            if (usersWithoutPhone.length > 0) {
                console.log(`⚠️  ${usersWithoutPhone.length} utilisateur(s) sans numéro de téléphone :`);
                usersWithoutPhone.forEach(u => {
                    console.log(`   • ${u.name} (${u.email})`);
                });
                console.log('');
            }
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

listUsers();
