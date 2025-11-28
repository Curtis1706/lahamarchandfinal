"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"

export default function OeuvresPage() {
  const router = useRouter()

  return (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-8 w-8 text-orange-600" />
            <CardTitle className="text-2xl">Accès refusé</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            Le Représentant n'a pas accès aux modules Œuvres selon le cahier des charges.
          </p>
          <p className="text-sm text-gray-600">
            Cette fonctionnalité est réservée aux administrateurs, au PDG et aux auteurs.
            Le Représentant peut uniquement consulter le catalogue public en lecture seule si nécessaire pour la promotion.
          </p>
          <Button 
            onClick={() => router.push('/dashboard/representant')}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
