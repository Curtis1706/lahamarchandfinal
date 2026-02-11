import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcryptjs from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import { logger } from "@/lib/logger"

// Force loading environment variables
if (!process.env.DATABASE_URL) {
  require('dotenv').config()
}


// Étendre les types NextAuth
declare module "next-auth" {
  interface User {
    role: Role
    status?: string
  }
  interface Session {
    user: User & {
      id: string
      role: Role
      status?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    status?: string
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development",
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Ne JAMAIS logger les credentials (email/password)

        if (!credentials?.email || !credentials?.password) {
          logger.debug("Missing credentials");
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            logger.debug("User not found");
            return null
          }

          logger.debug("User found", { userId: user.id, role: user.role, status: user.status });

          // Vérifier si l'utilisateur est suspendu ou inactif
          if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
            logger.warn("Login attempt by suspended/inactive user", { userId: user.id, status: user.status });
            throw new Error(user.status === 'SUSPENDED' ? "Votre compte a été suspendu. Veuillez contacter l'administrateur." : "Votre compte est désactivé.");
          }

          const isPasswordValid = await bcryptjs.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            logger.debug("Invalid password");
            return null
          }

          // Mettre à jour la dernière connexion
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() }
            })
            logger.debug("Last login updated", { userId: user.id });
          } catch (updateError) {
            logger.error("Error updating lastLoginAt", updateError);
            // Ne pas bloquer la connexion si la mise à jour échoue
          }

          logger.info("Authentication successful", { userId: user.id, role: user.role });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
          }
        } catch (error) {
          logger.error("NextAuth authorize error", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
        token.status = user.status
      }

      // When update() is called from client
      if (trigger === "update") {
        // Fetch fresh user data from database
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id }
        })

        if (freshUser) {
          token.name = freshUser.name
          token.email = freshUser.email
          token.picture = freshUser.image
          token.role = freshUser.role
          token.status = freshUser.status
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.status = token.status
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.picture as string | null
      }
      return session
    }
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.status = user.status
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = (token.id as string) || (token.sub as string) || ''
        session.user.role = token.role as Role
        session.user.status = token.status as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error"
  },
  debug: process.env.NODE_ENV === "development"
}

export default NextAuth(authOptions)
