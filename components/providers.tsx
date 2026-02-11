"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { SuspensionProvider } from "@/components/providers/suspension-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
        forcedTheme="light"
      >
        <SuspensionProvider>
          {children}
        </SuspensionProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
