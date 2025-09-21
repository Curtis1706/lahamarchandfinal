"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Maximize2, Trash2 } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

interface Diffusion {
  code: string
  titre: string
  statut: "Actif" | "Oui" | "Non"
  vue: "Non" | "Oui"
  destinateur: string
  expediteur: string
  dateCreation: string
  actions: string[]
}

const mockDiffusions: Diffusion[] = [
  {
    code: "WELCOME_CLIENT",
    titre: "Bienvenue",
    statut: "Actif",
    vue: "Non",
    destinateur: "Bile FASSINOU (+22990195554315)",
    expediteur: "PDG (Super)",
    dateCreation: "jeu. 18 sept. 2025 17:40",
    actions: ["delete"],
  },
  {
    code: "WELCOME_CLIENT",
    titre: "Bienvenue",
    statut: "Actif",
    vue: "Oui",
    destinateur: "ECOLE CONTRATUELLE (+22994551975)",
    expediteur: "Super administrateur (FASSINOU)",
    dateCreation: "mar. 16 sept. 2025 11:33",
    actions: ["delete"],
  },
  {
    code: "NEW_ACCOUNT_CREATED",
    titre:
      "Bienvenue ! Votre compte a été créé avec succès. Vous pouvez maintenant commencer à explorer toutes les fonctionnalités de l'application.",
    statut: "Actif",
    vue: "Oui",
    destinateur: "Partenaire (partenaire)",
    expediteur: "Super administrateur (FASSINOU)",
    dateCreation: "mar. 16 sept. 2025 11:21",
    actions: ["delete"],
  },
  {
    code: "ORDER_GET",
    titre: "Réception de livres commandés",
    statut: "Actif",
    vue: "Oui",
    destinateur: "ECOLE CONTRATUELLE (+22994551975)",
    expediteur: "PDG (Super)",
    dateCreation: "mer. 27 août 2025 17:03",
    actions: ["delete"],
  },
  {
    code: "ORDER_GET_RES",
    titre: "Réception de livres commandés",
    statut: "Actif",
    vue: "Non",
    destinateur: "Responsable de département (ABIOLA Espédit)",
    expediteur: "PDG (Super)",
    dateCreation: "mer. 27 août 2025 17:03",
    actions: ["delete"],
  },
]

export default function DiffusionPage() {
  const [diffusions, setDiffusions] = useState<Diffusion[]>(mockDiffusions)

  const handleRefresh = () => {
    console.log("[v0] Refreshing diffusions...")
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleDelete = (index: number) => {
    setDiffusions((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <DashboardLayout title="" >
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Gestions des notifications</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">Tableau de bord - Diffusions</span>

          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header Section */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Liste de diffusion</h3>
              <div className="flex items-center space-x-2">
                <button onClick={handleRefresh} className="p-2 hover:bg-gray-100 rounded-lg" title="Actualiser">
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button onClick={handleFullscreen} className="p-2 hover:bg-gray-100 rounded-lg" title="Plein écran">
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Afficher</span>
                <Select defaultValue="5">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm">éléments</span>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Rechercher:</span>
                  <Input className="w-64" placeholder="" />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destinateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expéditeur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date création
                    <button className="ml-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {diffusions.map((diffusion, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        {diffusion.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={diffusion.titre}>
                        {diffusion.titre}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className="bg-green-100 text-green-800">{diffusion.statut}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={
                          diffusion.vue === "Oui" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                        }
                      >
                        {diffusion.vue}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge className="bg-blue-100 text-blue-800 text-xs">{diffusion.destinateur}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge className="bg-cyan-100 text-cyan-800 text-xs">{diffusion.expediteur}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{diffusion.dateCreation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => handleDelete(index)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Affichage de 1 à 5 sur 117 éléments</p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  Premier
                </Button>
                <Button variant="outline" size="sm">
                  Précédent
                </Button>
                <Button variant="outline" size="sm" className="bg-blue-600 text-white">
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
                  4
                </Button>
                <Button variant="outline" size="sm">
                  5
                </Button>
                <span className="text-sm">...</span>
                <Button variant="outline" size="sm">
                  24
                </Button>
                <Button variant="outline" size="sm">
                  Suivant
                </Button>
                <Button variant="outline" size="sm">
                  Dernier
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
