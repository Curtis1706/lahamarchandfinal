
import { PrismaClient, Role, ClientType } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("Creating wholesaler account...")

    const email = "grossiste2@laha.gabon" // Changed email to avoid conflict if partial creation happened
    const password = "Grossiste2025!"
    const hashedPassword = await bcrypt.hash(password, 12)

    try {
        // 1. Upsert User
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: Role.CLIENT,
                status: "ACTIVE",
                emailVerified: new Date(),
            },
            create: {
                name: "Grossiste Test",
                email,
                password: hashedPassword,
                role: Role.CLIENT,
                status: "ACTIVE",
                emailVerified: new Date(),
            },
        })
        console.log(`User ${user.email} upserted.`)

        // 2. Find or Create Client
        let client = await prisma.client.findFirst({
            where: { email }
        })

        if (!client) {
            client = await prisma.client.create({
                data: {
                    nom: "Grossiste Test",
                    email,
                    telephone: "+24106000000",
                    type: ClientType.grossiste,
                    statut: "ACTIF"
                }
            })
            console.log(`Client record created.`)
        } else {
            // Update client type if exists
            client = await prisma.client.update({
                where: { id: client.id },
                data: {
                    type: ClientType.grossiste,
                    statut: "ACTIF"
                }
            })
            console.log(`Client record updated.`)
        }

        // 3. Connect User and Client
        // Check if already connected? Prisma handles connect nicely if already connected in many-to-many?
        // Actually, explicit connect is safer.
        await prisma.user.update({
            where: { id: user.id },
            data: {
                clients: {
                    connect: { id: client.id }
                }
            }
        })
        console.log(`User linked to Client record.`)

        console.log("✅ Wholesaler account ready!")
        console.log(`📧 Email: ${email}`)
        console.log(`🔑 Password: ${password}`)

    } catch (error) {
        console.error("❌ Error creating wholesaler account:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
