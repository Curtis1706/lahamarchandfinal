// Script pour vérifier la base de données et les données existantes
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("🔍 Vérification de la base de données...");
    
    // Vérifier la connexion
    await prisma.$connect();
    console.log("✅ Connexion à la base de données réussie");

    // Vérifier les disciplines
    const disciplines = await prisma.discipline.findMany();
    console.log(`📚 Disciplines (${disciplines.length}):`, disciplines.map(d => ({ id: d.id, name: d.name })));

    // Vérifier les utilisateurs
    const users = await prisma.user.findMany();
    console.log(`👥 Utilisateurs (${users.length}):`, users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));

    // Vérifier les œuvres existantes
    const works = await prisma.work.findMany();
    console.log(`📖 Œuvres (${works.length}):`, works.map(w => ({ id: w.id, title: w.title, isbn: w.isbn, status: w.status })));

    // Vérifier les notifications
    const notifications = await prisma.notification.findMany();
    console.log(`🔔 Notifications (${notifications.length}):`, notifications.map(n => ({ id: n.id, title: n.title, type: n.type })));

    // Vérifier les logs d'audit
    const auditLogs = await prisma.auditLog.findMany();
    console.log(`📝 Logs d'audit (${auditLogs.length}):`, auditLogs.map(a => ({ id: a.id, action: a.action, performedBy: a.performedBy })));

  } catch (error) {
    console.error("❌ Erreur lors de la vérification de la base de données:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();


