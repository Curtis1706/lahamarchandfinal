"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Maximize2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Diffusion {
  id: string
  code: string
  titre: string
  statut: "Actif" | "Oui" | "Non"
  vue: "Non" | "Oui"
  destinateur: string
  expediteur: string
  dateCreation: string
  message?: string
  actions: string[]
}

export default function DiffusionPage() {
  const [diffusions, setDiffusions] = useState<Diffusion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadDiffusions()
  }, [])

  const loadDiffusions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pdg/notifications-diffusion')
      if (response.ok) {
        const data = await response.json()
        setDiffusions(data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les diffusions",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading diffusions:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des diffusions",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadDiffusions()
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette diffusion ?")) {
      return
    }

    try {
      const response = await fetch(`/api/pdg/notifications-diffusion?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Diffusion supprimée avec succès"
        })
        loadDiffusions()
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la diffusion",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting diffusion:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      })
    }
  }

  const filteredDiffusions = diffusions.filter((diff) =>
    diff.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diff.destinateur.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Diffusion des notifications</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-slate-600 rounded"
              title="Actualiser"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleFullscreen}
              className="p-2 hover:bg-slate-600 rounded"
              title="Plein écran"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <span className="text-sm text-slate-300">
              Tableau de bord - Diffusion des notifications
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold mb-4">
              Historique des notifications envoyées
            </h3>

            {/* Table Controls */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select defaultValue="20">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">éléments</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rechercher:</span>
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Code
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Titre
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Statut
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Vue
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Destinataire
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Expéditeur
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Date création
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      Chargement des diffusions...
                    </td>
                  </tr>
                ) : filteredDiffusions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      Aucune diffusion trouvée
                    </td>
                  </tr>
                ) : (
                  filteredDiffusions.map((diffusion, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{diffusion.code}</td>
                      <td className="py-3 px-4 text-sm font-medium max-w-xs truncate">
                        {diffusion.titre}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          {diffusion.statut}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={diffusion.vue === "Oui" ? "default" : "secondary"}
                          className={
                            diffusion.vue === "Oui"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {diffusion.vue}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {diffusion.destinateur}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {diffusion.expediteur}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {diffusion.dateCreation}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDelete(diffusion.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-6 border-t flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Affichage de 1 à {filteredDiffusions.length} sur {diffusions.length} éléments
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Premier</Button>
              <Button variant="outline" size="sm">Précédent</Button>
              <Button variant="outline" size="sm" className="bg-indigo-600 text-white">
                1
              </Button>
              <Button variant="outline" size="sm">Suivant</Button>
              <Button variant="outline" size="sm">Dernier</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}