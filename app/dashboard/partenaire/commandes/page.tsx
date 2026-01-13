"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function PartenaireCommandesPage() {
  const router = useRouter()

  useEffect(() => {
    // Rediriger vers la page ventes
    router.replace("/dashboard/partenaire/ventes")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-gray-500">Redirection vers la page Ventes...</p>
      </div>
    </div>
  )
}
