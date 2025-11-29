"use client"

import { useState, useEffect } from "react"
import { useGuest } from "@/hooks/use-guest"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useCart } from "@/hooks/use-cart"
import { GuestBanner } from "@/components/guest-banner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ShoppingCart, 
  BookOpen, 
  Package, 
  TrendingUp,
  Search,
  ArrowRight,
  UserPlus,
  LogIn
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface RecentWork {
  id: string
  title: string
  price: number
  image?: string
  discipline?: {
    name: string
  }
}

export default function InviteDashboardPage() {
  const { isGuest } = useGuest()
  const { user } = useCurrentUser()
  const { cart, getTotalItems, getTotalPrice } = useCart()
  const router = useRouter()
  const [recentWorks, setRecentWorks] = useState<RecentWork[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Charger les données pour les invités non authentifiés ou les utilisateurs avec rôle INVITE
    if (isGuest || (user && user.role === 'INVITE')) {
      loadRecentWorks()
    }
  }, [isGuest, user])

  const loadRecentWorks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/works/public?limit=6")
      if (response.ok) {
        const data = await response.json()
        const works = (data.works || []).slice(0, 6)
        setRecentWorks(works)
      }
    } catch (error) {
      console.error("Error loading recent works:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getBookImageUrl = (work: any): string => {
    if (work.files) {
      try {
        const filesData = typeof work.files === 'string' ? JSON.parse(work.files) : work.files
        if (filesData.coverImage) {
          return filesData.coverImage
        }
      } catch (e) {
        console.error("Error parsing files:", e)
      }
    }
    
    const defaultImages = [
      '/01.png',
      '/02.png', 
      '/10001.png',
      '/10002.png',
      '/10011.png',
      '/10012.png',
      '/10013.png'
    ]
    
    const randomIndex = Math.floor(Math.random() * defaultImages.length)
    return defaultImages[randomIndex]
  }

  return (
    <>
      <GuestBanner />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bienvenue sur LahaMarchand
            </h1>
            <p className="text-gray-600">
              Découvrez notre collection de livres et passez vos commandes
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Livres dans le panier
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalItems()}</div>
                <p className="text-xs text-muted-foreground">
                  {getTotalPrice().toLocaleString()} F CFA
                </p>
                {getTotalItems() > 0 && (
                  <Link href="/checkout">
                    <Button size="sm" className="mt-2 w-full">
                      Voir le panier
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Catalogue disponible
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Explorer</div>
                <p className="text-xs text-muted-foreground">
                  Découvrez tous nos livres
                </p>
                <Link href="/dashboard/invite/catalogue">
                  <Button size="sm" variant="outline" className="mt-2 w-full">
                    Voir le catalogue
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Créer un compte
                </CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Gratuit</div>
                <p className="text-xs text-muted-foreground">
                  Suivez vos commandes
                </p>
                <Link href="/auth/signup">
                  <Button size="sm" variant="outline" className="mt-2 w-full">
                    S'inscrire
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
                <CardDescription>
                  Accédez rapidement aux fonctionnalités principales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard/invite/catalogue">
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher un livre
                  </Button>
                </Link>
                {getTotalItems() > 0 && (
                  <Link href="/checkout">
                    <Button variant="outline" className="w-full justify-start">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Finaliser ma commande ({getTotalItems()} article{getTotalItems() > 1 ? 's' : ''})
                    </Button>
                  </Link>
                )}
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full justify-start">
                    <LogIn className="h-4 w-4 mr-2" />
                    Se connecter
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="w-full justify-start">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Créer un compte
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avantages d'un compte</CardTitle>
                <CardDescription>
                  Pourquoi créer un compte ?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Suivi des commandes</p>
                    <p className="text-xs text-gray-500">Consultez l'état de vos commandes en temps réel</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Promotions personnalisées</p>
                    <p className="text-xs text-gray-500">Recevez des offres exclusives par email</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Historique des achats</p>
                    <p className="text-xs text-gray-500">Retrouvez tous vos achats précédents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Works */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Livres populaires</CardTitle>
                  <CardDescription>
                    Découvrez nos livres les plus récents
                  </CardDescription>
                </div>
                <Link href="/dashboard/invite/catalogue">
                  <Button variant="outline" size="sm">
                    Voir tout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : recentWorks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun livre disponible</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {recentWorks.map((work) => (
                    <Link key={work.id} href={`/livre/${work.id}`}>
                      <div className="group cursor-pointer">
                        <div className="relative h-40 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-2 overflow-hidden">
                          <Image
                            src={getBookImageUrl(work)}
                            alt={work.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/placeholder.jpg'
                            }}
                          />
                          {work.discipline && (
                            <Badge variant="secondary" className="absolute top-2 right-2 bg-white/90 text-xs">
                              {work.discipline.name}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {work.title}
                        </h3>
                        <p className="text-sm font-bold text-green-600 mt-1">
                          {work.price.toLocaleString()} F CFA
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}


