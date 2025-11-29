"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGuest } from "@/hooks/use-guest"
import { useCart } from "@/hooks/use-cart"
import { GuestBanner } from "@/components/guest-banner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ShoppingCart, Package, Plus, Minus, BookOpen } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"

interface Work {
  id: string
  title: string
  isbn: string
  price: number
  tva: number
  stock: number
  files?: string
  description?: string
  discipline?: {
    id: string
    name: string
  }
  author?: {
    id: string
    name: string
  }
  status: string
  discount?: {
    id: string
    type: string
    reduction: number
  } | null
  finalPrice?: number
}

const getBookImageUrl = (work: Work): string => {
  if (work.files) {
    try {
      const filesData = typeof work.files === 'string' ? JSON.parse(work.files) : work.files
      if (filesData.coverImage) {
        return filesData.coverImage
      }
    } catch (e) {
      console.error("Erreur lors du parsing des fichiers:", e)
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

export default function LivreDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isGuest } = useGuest()
  const { addToCart, isInCart } = useCart()
  const [work, setWork] = useState<Work | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (params.id) {
      loadWork()
    }
  }, [params.id])

  const loadWork = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/works/public?id=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        const workData = data.work || data.works?.[0]
        
        if (workData) {
          // Charger la remise
          try {
            const discountResponse = await fetch(
              `/api/discounts/applicable/public?workId=${workData.id}&workTitle=${encodeURIComponent(workData.title)}&clientType=Client&quantity=${quantity}`
            )
            
            if (discountResponse.ok) {
              const discountData = await discountResponse.json()
              const discount = discountData.applicable
              
              let finalPrice = workData.price || 0
              if (discount && workData.price) {
                if (discount.type === 'Pourcentage') {
                  finalPrice = workData.price * (1 - discount.reduction / 100)
                } else if (discount.type === 'Montant') {
                  finalPrice = Math.max(0, workData.price - discount.reduction)
                }
              }
              
              setWork({
                ...workData,
                discount: discount,
                finalPrice: finalPrice
              })
            } else {
              setWork({
                ...workData,
                discount: null,
                finalPrice: workData.price || 0
              })
            }
          } catch (error) {
            console.error("Error loading discount:", error)
            setWork({
              ...workData,
              discount: null,
              finalPrice: workData.price || 0
            })
          }
        }
      }
    } catch (error) {
      console.error("Error loading work:", error)
      toast.error("Erreur lors du chargement du livre")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!work) return
    
    if (work.stock <= 0) {
      toast.error("Ce livre n'est plus en stock")
      return
    }
    
    if (quantity > work.stock) {
      toast.error(`Stock disponible : ${work.stock} exemplaires`)
      return
    }
    
    addToCart({
      id: work.id,
      title: work.title,
      isbn: work.isbn,
      price: work.finalPrice || work.price,
      tva: work.tva || 0.18,
      stock: work.stock,
      discipline: work.discipline || { id: '', name: '' },
      image: getBookImageUrl(work),
      files: work.files
    } as any, quantity)
    
    toast.success(`${quantity} exemplaire(s) de "${work.title}" ajouté(s) au panier`)
  }

  if (isLoading) {
    return (
      <>
        <GuestBanner />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Chargement...</p>
          </div>
        </div>
      </>
    )
  }

  if (!work) {
    return (
      <>
        <GuestBanner />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Livre non trouvé</p>
            <Link href="/catalogue">
              <Button variant="outline" className="mt-4">
                Retour au catalogue
              </Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <GuestBanner />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/catalogue">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au catalogue
            </Button>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image */}
            <div className="relative h-96 lg:h-[500px] bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg overflow-hidden">
              <Image
                src={getBookImageUrl(work)}
                alt={work.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder.jpg'
                }}
              />
              {work.discount && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500 text-white text-lg px-3 py-1">
                    -{work.discount.type === 'Pourcentage' 
                      ? `${work.discount.reduction}%` 
                      : `${work.discount.reduction} F CFA`}
                  </Badge>
                </div>
              )}
            </div>

            {/* Détails */}
            <div className="space-y-6">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {work.discipline?.name || "N/A"}
                </Badge>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{work.title}</h1>
                {work.author && (
                  <p className="text-lg text-gray-600 mb-4">Par {work.author.name}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">ISBN</p>
                  <p className="font-mono text-lg">{work.isbn}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Disponibilité</p>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <p className="font-medium">
                      {work.stock > 0 ? `${work.stock} exemplaire(s) disponible(s)` : "Rupture de stock"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Prix</p>
                  {work.discount && work.price ? (
                    <div className="flex items-center gap-3">
                      <span className="text-xl text-gray-500 line-through">
                        {work.price.toLocaleString()} F CFA
                      </span>
                      <span className="text-3xl font-bold text-green-600">
                        {work.finalPrice?.toLocaleString()} F CFA
                      </span>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-green-600">
                      {work.price.toLocaleString()} F CFA
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">TVA: {(work.tva * 100).toFixed(0)}%</p>
                </div>
              </div>

              {work.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Description</p>
                    <p className="text-gray-600 whitespace-pre-line">{work.description}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Quantité et ajout au panier */}
              {work.stock > 0 ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Quantité</p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.min(work.stock, quantity + 1))}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Ajouter au panier
                  </Button>
                </div>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  Rupture de stock
                </Button>
              )}

              <Link href="/checkout">
                <Button variant="outline" className="w-full">
                  Passer la commande
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


