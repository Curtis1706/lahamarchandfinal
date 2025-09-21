"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus } from "lucide-react"

interface ProformaModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProformaModal({ isOpen, onClose }: ProformaModalProps) {
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [quantity, setQuantity] = useState("")

  const addItem = () => {
    if (quantity && Number.parseInt(quantity) > 0) {
      setSelectedItems([
        ...selectedItems,
        {
          livre: "Livre sélectionné",
          prix: 1000,
          quantite: Number.parseInt(quantity),
          montant: 1000 * Number.parseInt(quantity),
        },
      ])
      setQuantity("")
    }
  }

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index))
  }

  const total = selectedItems.reduce((sum, item) => sum + item.montant, 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[95vh] overflow-y-auto p-0 sm:w-[90vw] md:w-[85vw] lg:w-[80vw]">
        <DialogHeader className="p-4 sm:p-6 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-semibold">Facture Proforma</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="w-full">
            <label className="block text-sm font-medium mb-2">Sélectionner le client</label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez un client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client1">Client 1</SelectItem>
                <SelectItem value="client2">Client 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Choix de la catégorie</label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manuels">Manuels</SelectItem>
                  <SelectItem value="livres">Livres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Choix de la Matière</label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez une matière" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="francais">Français</SelectItem>
                  <SelectItem value="maths">Mathématiques</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium mb-2">Choix de la classe</label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez la classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ce1">CE1</SelectItem>
                  <SelectItem value="ce2">CE2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Choix du livre</label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez un livre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="livre1">Livre 1</SelectItem>
                  <SelectItem value="livre2">Livre 2</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-red-500 mt-1">Sélectionnez un livre</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quantité</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="flex-1"
                />
                <Button onClick={addItem} className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Ajouter</span>
                </Button>
              </div>
              <p className="text-sm text-red-500 mt-1">La quantité doit être supérieur à 0</p>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">Livre</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">Prix</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">Quantité</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">Montant</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 sm:p-8 text-center text-gray-500 text-sm">
                        Aucun livre ajouté
                      </td>
                    </tr>
                  ) : (
                    selectedItems.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">{item.livre}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">{item.prix} F CFA</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">{item.quantite}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">{item.montant} F CFA</td>
                        <td className="p-2 sm:p-3">
                          <Button variant="destructive" size="sm" onClick={() => removeItem(index)}>
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 sm:p-4 bg-gray-50 border-t">
              <div className="text-right">
                <span className="text-base sm:text-lg font-semibold">Total: {total} XOF</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Code promo</label>
              <div className="flex gap-2">
                <Input placeholder="CODE PROMO" className="flex-1" />
                <Button className="bg-indigo-600 hover:bg-indigo-700 shrink-0">Appliquer</Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type de commande</label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Commande pour la rentrée scolaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rentree">Commande pour la rentrée scolaire</SelectItem>
                  <SelectItem value="vacances">Commande pour les vacances</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto" onClick={onClose}>
              Enregistrer
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto bg-transparent">
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
