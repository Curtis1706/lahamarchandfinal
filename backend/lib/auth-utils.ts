import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@prisma/client"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role as Role)) {
    throw new Error("Forbidden")
  }
  return user
}

export async function requirePDG() {
  return requireRole([Role.PDG])
}

export async function requireRepresentantOrPDG() {
  return requireRole([Role.PDG, Role.REPRESENTANT])
}

