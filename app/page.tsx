"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, FileText, Shield, ArrowRight, LogIn, UserPlus } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Si l'utilisateur est déjà connecté, rediriger vers son dashboard
    if (status === "authenticated" && session?.user) {
      router.push("/dashboard")
    }
  }, [status, session, router])

  const handleContinueAsGuest = () => {
    // Le mode invité est automatique - juste naviguer vers une page publique
    router.push("/works/public")
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    )
  }

  if (status === "authenticated") {
    return null // La redirection est gérée par useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">LAHA Marchand</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Se connecter</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Créer un compte
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Bienvenue sur LAHA Marchand
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Plateforme de gestion et de distribution d'œuvres littéraires
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            onClick={handleContinueAsGuest}
            size="lg"
            variant="outline"
            className="bg-white hover:bg-gray-50 text-lg px-8 py-6"
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            Continuer comme invité
          </Button>
          <Link href="/auth/login">
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Se connecter
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button
              size="lg"
              variant="default"
              className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Créer un compte
            </Button>
          </Link>
        </div>

        {/* Info about Guest Mode */}
        <Card className="mb-12 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-indigo-600" />
              Mode invité
            </CardTitle>
            <CardDescription>
              Explorez notre plateforme sans créer de compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Accès au catalogue public des œuvres</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Consultation des projets publics</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Accès à la documentation et FAQ</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span>Fonctionnalités limitées - Créez un compte pour accéder à toutes les fonctionnalités</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <BookOpen className="w-8 h-8 text-indigo-600 mb-2" />
              <CardTitle>Gestion d'œuvres</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Créez, gérez et publiez vos œuvres littéraires
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle>Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Travaillez en équipe avec auteurs, concepteurs et partenaires
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle>Suivi et rapports</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Suivez vos ventes, stocks et performances en temps réel
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Explorez nos pages publiques :</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/works/public">
              <Button variant="outline">Catalogue des œuvres</Button>
            </Link>
            <Link href="/projects/public">
              <Button variant="outline">Projets publics</Button>
            </Link>
            <Link href="/about">
              <Button variant="outline">À propos</Button>
            </Link>
            <Link href="/faq">
              <Button variant="outline">FAQ</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline">Contact</Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">LAHA Marchand</h3>
              <p className="text-gray-400 text-sm">
                Plateforme de gestion et distribution d'œuvres littéraires
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Liens utiles</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white">À propos</Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white">FAQ</Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">Conditions d'utilisation</Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">Contact</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Compte</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/auth/login" className="hover:text-white">Se connecter</Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="hover:text-white">Créer un compte</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} LAHA Marchand. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
