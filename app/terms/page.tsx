"use client"

import { GuestBanner } from "@/components/guest-banner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <>
      <GuestBanner />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Conditions d'utilisation</h1>
            <p className="text-gray-600">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>1. Acceptation des conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600">
              <p>
                En accédant et en utilisant LAHA Marchand, vous acceptez d'être lié par ces conditions d'utilisation.
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.
              </p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>2. Utilisation de la plateforme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600">
              <p>
                Vous vous engagez à utiliser la plateforme de manière légale et conforme à ces conditions.
                Vous ne devez pas utiliser la plateforme pour des activités illégales ou non autorisées.
              </p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>3. Propriété intellectuelle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600">
              <p>
                Tous les contenus de la plateforme, y compris les œuvres publiées, sont protégés par les lois
                sur la propriété intellectuelle. Vous ne pouvez pas reproduire, distribuer ou utiliser ces contenus
                sans autorisation.
              </p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>4. Confidentialité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600">
              <p>
                Nous respectons votre vie privée. Consultez notre politique de confidentialité pour plus
                d'informations sur la collecte et l'utilisation de vos données.
              </p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>5. Limitation de responsabilité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600">
              <p>
                LAHA Marchand ne peut être tenu responsable des dommages directs ou indirects résultant de
                l'utilisation de la plateforme.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

