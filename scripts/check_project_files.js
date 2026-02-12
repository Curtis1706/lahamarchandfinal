
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany({
        select: {
            id: true,
            title: true,
            files: true,
            concepteur: {
                select: { name: true }
            }
        }
    });

    console.log("Projects found:", projects.length);
    projects.forEach(p => {
        console.log("--------------------------------------------------");
        console.log(`Project: ${p.title} (${p.id})`);
        console.log(`Concepteur: ${p.concepteur.name}`);
        console.log(`Files (${typeof p.files}): ${p.files}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
