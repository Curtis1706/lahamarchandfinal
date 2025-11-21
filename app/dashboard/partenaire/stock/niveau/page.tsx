"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Package,
  FileText,
  Users,
  BookOpen,
  Printer,
  Eye,
  AlertTriangle,
} from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

export default function NiveauStockPage() {
  const { user } = useCurrentUser()
  const [stockData, setStockData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("toutes")
  const [selectedDiscipline, setSelectedDiscipline] = useState("toutes")
  const [selectedClass, setSelectedClass] = useState("toutes")
  const [selectedStatus, setSelectedStatus] = useState("tous")

  // Charger le stock au montage et quand les filtres changent
  useEffect(() => {
    const loadStock = async () => {
      try {
        setIsLoading(true)
        
        const data = await apiClient.getPartenaireStockAllocation({ 
          discipline: selectedDiscipline === 'toutes' ? undefined : selectedDiscipline
        })
        
        setStockData(data.stockItems || data || [])
        
      } catch (error: any) {
        console.error('Erreur lors du chargement du stock:', error)
        toast.error('Erreur lors du chargement du stock')
        setStockData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadStock()
  }, [selectedDiscipline, selectedStatus])

  // Calculer les statistiques
  const totalStock = stockData.reduce((sum, item) => sum + (item.allocatedQuantity || 0), 0)
  const totalDepot = stockData.reduce((sum, item) => sum + (item.availableQuantity || 0), 0)
  const totalRentree = stockData.reduce((sum, item) => sum + (item.soldQuantity || 0), 0)
  const stockFaibleCount = stockData.filter(item => (item.availableQuantity || 0) < 20).length

  // Filtrer les données
  useEffect(() => {
    let filtered = stockData

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.isbn.includes(searchTerm)
      )
    }

    if (selectedCategory !== "toutes") {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    if (selectedDiscipline !== "toutes") {
      filtered = filtered.filter(item => item.discipline === selectedDiscipline)
    }

    if (selectedClass !== "toutes") {
      filtered = filtered.filter(item => item.class === selectedClass)
    }

    if (selectedStatus === "stock-faible") {
      filtered = filtered.filter(item => item.stockFaible)
    }

    setFilteredData(filtered)
  }, [searchTerm, selectedCategory, selectedDiscipline, selectedClass, selectedStatus, stockData])

  return (
    <div>
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Stock alloué - {user?.name}</h2>
            <p className="text-sm text-slate-300 mt-1">Consultation en lecture seule</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Articles attribués uniquement
            </span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Rentrée scolaire</h3>
              <div className="text-4xl font-bold text-gray-800 mb-2">{totalRentree}</div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Vacances</h3>
              <div className="text-4xl font-bold text-gray-800 mb-2">{stockData.reduce((sum, item) => sum + item.vacances, 0)}</div>
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">En dépôt</h3>
              <div className="text-4xl font-bold text-gray-800 mb-2">{totalDepot}</div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Total alloué</h3>
              <div className="text-4xl font-bold text-gray-800 mb-2">{totalStock}</div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg mx-auto flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Alerte stock faible */}
          {stockFaibleCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-medium">
                  {stockFaibleCount} article{stockFaibleCount > 1 ? 's' : ''} en stock faible
                </span>
              </div>
            </div>
          )}

          {/* Filters and Controls */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Filtres de consultation</h3>
              <p className="text-sm text-gray-600">Filtrez votre stock alloué selon vos besoins</p>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes catégories</SelectItem>
                  <SelectItem value="Primaire">Primaire</SelectItem>
                  <SelectItem value="Secondaire">Secondaire</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes disciplines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes disciplines</SelectItem>
                  <SelectItem value="Français">Français</SelectItem>
                  <SelectItem value="Mathématiques">Mathématiques</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes classes</SelectItem>
                  <SelectItem value="CE1">CE1</SelectItem>
                  <SelectItem value="CE2">CE2</SelectItem>
                  <SelectItem value="CE1-CE2">CE1-CE2</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous statuts</SelectItem>
                  <SelectItem value="stock-faible">Stock faible</SelectItem>
                  <SelectItem value="disponible">Disponible</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center">
                <Input 
                  placeholder="Rechercher..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Stock alloué par produit</h3>
              <p className="text-sm text-gray-600 mt-1">Articles attribués à votre organisation</p>
            </div>

            {/* Table Controls */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Afficher</span>
                  <Select defaultValue="20">
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600">éléments</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Résultats: {filteredData.length}</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4">LIVRE</th>
                    <th className="text-left p-4">DISCIPLINE</th>
                    <th className="text-left p-4">CLASSE</th>
                    <th className="text-left p-4">RENTRÉE</th>
                    <th className="text-left p-4">VACANCES</th>
                    <th className="text-left p-4">DÉPÔT</th>
                    <th className="text-left p-4">TOTAL</th>
                    <th className="text-left p-4">PRIX PUBLIC</th>
                    <th className="text-left p-4">PRIX REMISE</th>
                    <th className="text-left p-4">STATUT</th>
                    <th className="text-left p-4">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-gray-500">
                        Aucun article trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{item.title}</div>
                              <div className="text-xs text-gray-500">ISBN: {item.isbn}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm">{item.discipline}</td>
                        <td className="p-4 text-sm">{item.class}</td>
                        <td className="p-4 text-sm">{item.rentree}</td>
                        <td className="p-4 text-sm">{item.vacances}</td>
                        <td className="p-4 text-sm">{item.depot}</td>
                        <td className="p-4 text-sm font-medium">{item.total}</td>
                        <td className="p-4 text-sm">{item.prixPublic.toLocaleString()} F CFA</td>
                        <td className="p-4 text-sm text-green-600 font-medium">{item.prixRemise.toLocaleString()} F CFA</td>
                        <td className="p-4">
                          {item.stockFaible ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Stock faible
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Disponible
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Voir les détails"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-6 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Affichage de 1 à {filteredData.length} sur {filteredData.length} éléments
                </p>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Premier
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Précédent
                  </Button>
                  <Button variant="outline" size="sm" className="bg-indigo-600 text-white">
                    1
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Suivant
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Dernier
                  </Button>
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-end space-x-2">
                <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                  <Printer className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" className="bg-green-600 text-white hover:bg-green-700">
                  EXCEL
                </Button>
                <Button variant="outline">
                  <Printer className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

