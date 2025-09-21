import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 Fix missing PDG user")
    
    const hashedPassword = await bcrypt.hash("password123", 12)
    
    // Créer l'utilisateur PDG manquant
    const pdg = await prisma.user.upsert({
      where: { email: "pdg@lahamarchand.com" },
      update: {},
      create: {
        name: "PDG Admin",
        email: "pdg@lahamarchand.com",
        password: hashedPassword,
        role: "PDG",
        emailVerified: new Date(),
      }
    })
    
    console.log("✅ PDG user created:", pdg.name)
    
    return NextResponse.json({ 
      message: "PDG user created successfully",
      user: {
        id: pdg.id,
        name: pdg.name,
        email: pdg.email,
        role: pdg.role
      }
    })
    
  } catch (error) {
    console.error("❌ Error creating PDG user:", error)
    return NextResponse.json(
      { error: "Error creating PDG user" },
      { status: 500 }
    )
  }
}


