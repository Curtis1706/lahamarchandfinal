import { useSession } from "next-auth/react"
import { Role } from "@prisma/client"

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: Role
  phone?: string
  image?: string | null
  status?: string
  createdAt?: string
  disciplineId?: string
  clientType?: string | null
}

export function useCurrentUser() {
  const { data: session, status, update } = useSession()

  const refreshUser = async () => {
    await update()
  }

  return {
    user: session?.user as CurrentUser | undefined,
    isLoading: status === "loading",
    isAuthenticated: !!session?.user,
    role: session?.user?.role,
    refreshUser
  }
}
