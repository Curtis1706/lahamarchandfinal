"use client"
import DashboardLayout from "@/components/dashboard-layout"
import { RefreshCw, Maximize2, Edit, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function AvanceePage() {
  const handleRefresh = () => {
    // Refresh functionality
  }

  const advancedSettings = [
    {
      description: "Ristourne des partenaires sur les livres du primaire en promotion (Montant).",
      valeur: "200",
      statut: "Actif",
      modifieLe: "jeu. 18 sept. 2025 17:52",
    },
    {
      description: "Ristourne des partenaires sur les livres du primaire en promotion (%).",
      valeur: "0",
      statut: "Actif",
      modifieLe: "Invalid date",
    },
    {
      description: "Ristourne des partenaires sur les livres du primaire hors promotion (Montant).",
      valeur: "0",
      statut: "Actif",
      modifieLe: "Invalid date",
    },
    {
      description: "Ristourne des partenaires sur les livres du primaire hors promotion (%).",
      valeur: "0",
      statut: "Actif",
      modifieLe: "Invalid date",
    },
    {
      description: "Ristourne des partenaires sur les livres du secondaire en promotion (Montant).",
      valeur: "0",
      statut: "Actif",
      modifieLe: "Invalid date",
    },
    {
      description: "Ristourne des partenaires sur les livres du secondaire en promotion (%).",
      valeur: "0",
      statut: "Actif",
      modifieLe: "Invalid date",
    },
    {
      description: "Ristourne des partenaires sur les livres du secondaire hors promotion (Montant).",
      valeur: "0",
      statut: "Actif",
      modifieLe: "Invalid date",
    },
    {
      description: "Ristourne des partenaires sur les livres du secondaire hors promotion (%).",
      valeur: "0",
      statut: "Actif",
      modifieLe: "Invalid date",
    },
  ]

  return (
    <DashboardLayout
      title="Avancé"
      breadcrumb="Tableau de bord - Commandes"
      
      onRefresh={handleRefresh}
    >
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-3 sm:p-4 border-b flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 truncate">Paramètres avancés</h2>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <button onClick={handleRefresh} className="p-2 hover:bg-gray-100 rounded-lg" title="Actualiser">
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg" title="Agrandir">
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4 lg:p-6">
            {/* Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <Select defaultValue="tous">
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les statuts</SelectItem>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Afficher</span>
                  <Select defaultValue="20">
                    <SelectTrigger className="w-16 sm:w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600 whitespace-nowrap">éléments</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full lg:w-auto">
                <span className="text-sm text-gray-600 whitespace-nowrap">Rechercher:</span>
                <Input className="flex-1 lg:w-64" placeholder="" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[300px] sm:min-w-[400px]">
                          DESCRIPTION
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[80px]">
                          VALEUR
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[80px]">
                          STATUT
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[150px]">
                          MODIFIÉ LE
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[100px]">
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {advancedSettings.map((setting, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 break-words">
                            {setting.description}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 font-medium">
                            {setting.valeur}
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {setting.statut}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                            {setting.modifieLe}
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <button className="p-1 hover:bg-yellow-100 rounded" title="Modifier">
                                <Edit className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                              </button>
                              <button className="p-1 hover:bg-red-100 rounded" title="Supprimer">
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 sm:mt-6 gap-3 sm:gap-0">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Affichage de 1 à 8 sur 8 éléments
              </div>
              <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
                <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded">
                  Premier
                </button>
                <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded">
                  Précédent
                </button>
                <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-600 text-white rounded">1</button>
                <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded">
                  Suivant
                </button>
                <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded">
                  Dernier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
