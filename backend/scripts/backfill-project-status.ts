import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  console.log("🔄 Starting backfill: ACCEPTED -> APPROVED")
  
  // Convertir ACCEPTED -> APPROVED (si tu veux)
  const updated = await prisma.project.updateMany({
    where: { status: "ACCEPTED" },
    data: { status: "APPROVED" },
  })
  
  console.log(`✅ Backfilled ${updated.count} projects from ACCEPTED to APPROVED`)
  
  // Afficher les statuts actuels
  const stats = await prisma.project.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
  })
  
  console.log("\n📊 Current project status distribution:")
  stats.forEach((stat) => {
    console.log(`  ${stat.status}: ${stat._count.id}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

