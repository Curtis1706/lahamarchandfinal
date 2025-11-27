"use client"

import { GuestBanner } from "@/components/guest-banner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, Target, Shield } from "lucide-react"

export default function AboutPage() {
  return (
    <>
      <GuestBanner />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">À propos de LAHA Marchand</h1>
            <p className="text-xl text-gray-600">
              Plateforme de gestion et de distribution d'œuvres littéraires
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-6 h-6 mr-2 text-indigo-600" />
                  Notre mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  LAHA Marchand est une plateforme complète dédiée à la gestion et à la distribution
                  d'œuvres littéraires. Nous facilitons la collaboration entre auteurs, concepteurs,
                  partenaires et représentants pour créer, publier et distribuer des œuvres de qualité.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-6 h-6 mr-2 text-purple-600" />
                  Nos objectifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Simplifier la gestion des œuvres littéraires</li>
                  <li>• Faciliter la collaboration entre les différents acteurs</li>
                  <li>• Optimiser la distribution et la vente d'œuvres</li>
                  <li>• Fournir des outils de suivi et d'analyse performants</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-6 h-6 mr-2 text-green-600" />
                  Pour qui ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Auteurs</h4>
                    <p className="text-sm text-gray-600">
                      Créez et gérez vos œuvres, suivez vos ventes et droits d'auteur
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Concepteurs</h4>
                    <p className="text-sm text-gray-600">
                      Gérez vos projets et collaborez avec les auteurs
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Partenaires</h4>
                    <p className="text-sm text-gray-600">
                      Accédez à votre stock et gérez vos ventes
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Représentants</h4>
                    <p className="text-sm text-gray-600">
                      Suivez vos zones et gérez vos clients
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-blue-600" />
                  Sécurité et confidentialité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Nous prenons la sécurité et la confidentialité de vos données très au sérieux.
                  Toutes les données sont protégées et chiffrées selon les meilleures pratiques
                  de l'industrie.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

