'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { GuestBanner } from '@/components/guest-banner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ShoppingBag, Home } from 'lucide-react'

export default function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')

  return (
    <>
      <GuestBanner />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-2xl w-full px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Commande confirmée !
                </h1>
                <p className="text-gray-600">
                  Votre commande a été enregistrée avec succès.
                </p>
              </div>

              {orderId && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Numéro de commande</p>
                  <p className="text-lg font-mono font-semibold">
                    {orderId.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <p className="text-gray-700">
                  Votre commande est en attente de validation. Vous recevrez une confirmation par email ou SMS une fois que votre commande sera validée.
                </p>
                <p className="text-sm text-gray-500">
                  Pour suivre votre commande, veuillez créer un compte ou vous connecter.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/catalogue">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Home className="h-4 w-4 mr-2" />
                    Retour au catalogue
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="w-full sm:w-auto">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Créer un compte
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
