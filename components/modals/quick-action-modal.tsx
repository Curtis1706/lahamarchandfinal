"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Search, Plus, FileText, Users, Package, Settings, BarChart3 } from "lucide-react"
import { useState } from "react"

interface QuickActionModalProps {
  isOpen: boolean
  onClose: () => void
}

const quickActions = [
  {
    id: "new-order",
    title: "Nouvelle commande",
    description: "Créer une nouvelle commande client",
    icon: Plus,
    color: "bg-green-500 hover:bg-green-600",
    action: () => console.log("[v0] Creating new order..."),
  },
  {
    id: "proforma",
    title: "Facture Proforma",
    description: "Générer une facture proforma",
    icon: FileText,
    color: "bg-blue-500 hover:bg-blue-600",
    action: () => console.log("[v0] Creating proforma..."),
  },
  {
    id: "add-client",
    title: "Ajouter un client",
    description: "Enregistrer un nouveau client",
    icon: Users,
    color: "bg-purple-500 hover:bg-purple-600",
    action: () => console.log("[v0] Adding new client..."),
  },
  {
    id: "inventory",
    title: "Gestion stock",
    description: "Consulter et gérer l'inventaire",
    icon: Package,
    color: "bg-orange-500 hover:bg-orange-600",
    action: () => console.log("[v0] Opening inventory..."),
  },
  {
    id: "reports",
    title: "Rapports",
    description: "Générer des rapports de vente",
    icon: BarChart3,
    color: "bg-indigo-500 hover:bg-indigo-600",
    action: () => console.log("[v0] Opening reports..."),
  },
  {
    id: "settings",
    title: "Paramètres",
    description: "Configurer l'application",
    icon: Settings,
    color: "bg-gray-500 hover:bg-gray-600",
    action: () => console.log("[v0] Opening settings..."),
  },
]

export default function QuickActionModal({ isOpen, onClose }: QuickActionModalProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredActions = quickActions.filter(
    (action) =>
      action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleActionClick = (action: (typeof quickActions)[0]) => {
    action.action()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] p-0">
        <DialogHeader className="p-4 sm:p-6 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-semibold">Actions rapides</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher une action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredActions.map((action) => {
              const IconComponent = action.icon
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-3 hover:shadow-md transition-all duration-200 bg-transparent"
                  onClick={() => handleActionClick(action)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`p-2 rounded-lg text-white ${action.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-medium text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>

          {filteredActions.length === 0 && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune action trouvée pour "{searchTerm}"</p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">Utilisez Ctrl+K pour ouvrir rapidement ce menu</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
