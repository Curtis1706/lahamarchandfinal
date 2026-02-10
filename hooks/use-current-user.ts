import { useSession } from "next-auth/react"
import { Role } from "@prisma/client"

export interface CurrentUser {
  phone: ReactNode
  id: string
  name: string
  email: string
  role: Role
}

export function useCurrentUser() {
  const { data: session, status } = useSession()

  return {
    user: session?.user as CurrentUser | undefined,
    isLoading: status === "loading",
    isAuthenticated: !!session?.user,
    role: session?.user?.role
  }
}
