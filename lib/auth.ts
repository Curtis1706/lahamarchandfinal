import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcryptjs from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

// Force loading environment variables
if (!process.env.DATABASE_URL) {
  require('dotenv').config()
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
        console.log("🔍 NextAuth authorize called with:", { email: credentials?.email, hasPassword: !!credentials?.password });
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null
        }

        try {
          console.log("🔍 Looking for user:", credentials.email);
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            console.log("❌ User not found in database");
            return null
          }

          console.log("✅ User found:", { id: user.id, email: user.email, role: user.role });

          const isPasswordValid = await bcryptjs.compare(
            credentials.password,
            user.password
          )

          console.log("🔐 Password valid:", isPasswordValid);

          if (!isPasswordValid) {
            console.log("❌ Invalid password");
            return null
          }

          // Mettre à jour la dernière connexion
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() }
            })
            console.log("✅ Last login updated for:", user.email);
          } catch (updateError) {
            console.error("⚠️ Error updating lastLoginAt:", updateError);
            // Ne pas bloquer la connexion si la mise à jour échoue
          }

          console.log("✅ Authentication successful for:", user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error("❌ NextAuth authorize error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id || token.sub!
        session.user.role = token.role as Role
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/signup",
    error: "/auth/error"
  },
  debug: process.env.NODE_ENV === "development"
}

export default NextAuth(authOptions)
