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
    phone?: string | null
  }
  interface Session {
    user: User & {
      id: string
      role: Role
      status?: string
      clientType?: string | null
      phone?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    status?: string
    clientType?: string | null
    phone?: string | null
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        const identifier = credentials.email.trim();

        // Détecter si c'est un email ou un téléphone
        const isEmail = identifier.includes('@');

        // Rechercher l'utilisateur par email OU par téléphone
        const user = await prisma.user.findFirst({
          where: isEmail
            ? { email: identifier.toLowerCase() }
            : { phone: identifier }
        });

        if (!user) {
          throw new Error("Identifiants invalides");
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcryptjs.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Identifiants invalides");
        }

        // Vérifier le statut
        if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
          throw new Error("Compte suspendu ou inactif");
        }

        // Mettre à jour la dernière connexion
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        }).catch(err => {
          console.error("Erreur mise à jour lastLoginAt:", err);
        });

        // Retourner l'utilisateur
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          phone: user.phone
        };
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
        token.phone = (user as any).phone
      }

      // When update() is called from client OR on any JWT generation
      if (trigger === "update" || token.id) {
        // Fetch fresh user data from database
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: {
              // @ts-ignore - Prisma might complain if generation is outdated
              clients: {
                select: { type: true },
                take: 1
              }
            }
          }) as any // Cast to any to safely access potentially missing relations

          if (freshUser) {
            // Check if user is suspended - invalidate token if so
            if (freshUser.status === 'SUSPENDED' || freshUser.status === 'INACTIVE') {
              // Return null to invalidate the token
              return null as any
            }

            // Update token with fresh data
            token.name = freshUser.name
            token.email = freshUser.email
            token.picture = freshUser.image
            token.role = freshUser.role
            token.status = freshUser.status
            token.phone = freshUser.phone
            token.clientType = freshUser.clients?.[0]?.type || null
          }
        } catch (error) {
          console.error("Error fetching fresh user data", error);
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.status = token.status
        session.user.clientType = token.clientType
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.picture as string | null
        session.user.phone = token.phone
      }
      return session
    }
  },
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error"
  },
  debug: process.env.NODE_ENV === "development"
}

export default NextAuth(authOptions)
