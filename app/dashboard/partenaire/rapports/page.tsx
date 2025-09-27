"use client"

import { useState, useEffect } from "react"
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  DollarSign,
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  FileText,
  PieChart,
  Activity
} from "lucide-react"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data pour les rapports
const mockRapports = [
  {
    id: "RPT001",
    titre: "Rapport mensuel - Janvier 2025",
    type: "mensuel",
    periode: "2025-01",
    statut: "généré",
    dateCreation: "2025-01-31T10:00:00Z",
    donnees: {
      ventesTotal: 1250000,
      commandesTotal: 45,
      livresVendus: 320,
      chiffreAffaires: 1250000,
      evolution: "+12.5%"
    }
  },
  {
    id: "RPT002", 
    titre: "Rapport trimestriel - Q4 2024",
    type: "trimestriel",
    periode: "2024-Q4",
    statut: "généré",
    dateCreation: "2024-12-31T15:30:00Z",
    donnees: {
      ventesTotal: 3800000,
      commandesTotal: 128,
      livresVendus: 950,
      chiffreAffaires: 3800000,
      evolution: "+8.2%"
    }
  },
  {
    id: "RPT003",
    titre: "Rapport annuel - 2024",
    type: "annuel", 
    periode: "2024",
    statut: "en_cours",
    dateCreation: "2025-01-01T09:00:00Z",
    donnees: {
      ventesTotal: 0,
      commandesTotal: 0,
      livresVendus: 0,
      chiffreAffaires: 0,
      evolution: "0%"
    }
  }
]

const mockStatsGenerales = {
  totalVentes: 5050000,
  totalCommandes: 173,
  totalLivres: 1270,
  chiffreAffaires: 5050000,
  evolutionMensuelle: "+12.5%",
  meilleurMois: "Janvier 2025",
  disciplinePopulaire: "Sciences",
  livrePopulaire: "Mathématiques 6ème"
}

export default function RapportsPage() {
  const [rapports, setRapports] = useState(mockRapports)
  const [filteredRapports, setFilteredRapports] = useState(mockRapports)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("tous")
  const [statutFilter, setStatutFilter] = useState("tous")
  const [periodeFilter, setPeriodeFilter] = useState("tous")
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedRapport, setSelectedRapport] = useState<any>(null)

  // Filtrage des rapports
  useEffect(() => {
    let filtered = rapports.filter(rapport => {
      const matchesSearch = rapport.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           rapport.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === "tous" || rapport.type === typeFilter
      const matchesStatut = statutFilter === "tous" || rapport.statut === statutFilter
      const matchesPeriode = periodeFilter === "tous" || rapport.periode.includes(periodeFilter)
      
      return matchesSearch && matchesType && matchesStatut && matchesPeriode
    })
    
    setFilteredRapports(filtered)
  }, [rapports, searchTerm, typeFilter, statutFilter, periodeFilter])

  const viewDetails = (rapport: any) => {
    setSelectedRapport(rapport)
    setShowDetailModal(true)
  }

  const generateRapport = () => {
    // Simulation de génération de rapport
    const newRapport = {
      id: `RPT${Date.now().toString().slice(-3)}`,
      titre: `Rapport automatique - ${new Date().toLocaleDateString('fr-FR')}`,
      type: "automatique",
      periode: new Date().toISOString().slice(0, 7),
      statut: "généré",
      dateCreation: new Date().toISOString(),
      donnees: {
        ventesTotal: Math.floor(Math.random() * 1000000) + 500000,
        commandesTotal: Math.floor(Math.random() * 50) + 20,
        livresVendus: Math.floor(Math.random() * 200) + 100,
        chiffreAffaires: Math.floor(Math.random() * 1000000) + 500000,
        evolution: `+${(Math.random() * 20).toFixed(1)}%`
      }
    }
    
    setRapports([newRapport, ...rapports])
    alert("Rapport généré avec succès !")
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "mensuel": return <Calendar className="w-4 h-4" />
      case "trimestriel": return <BarChart3 className="w-4 h-4" />
      case "annuel": return <TrendingUp className="w-4 h-4" />
      case "automatique": return <Activity className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "mensuel": return "bg-blue-100 text-blue-800"
      case "trimestriel": return "bg-green-100 text-green-800"
      case "annuel": return "bg-purple-100 text-purple-800"
      case "automatique": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "généré": return "bg-green-100 text-green-800"
      case "en_cours": return "bg-yellow-100 text-yellow-800"
      case "erreur": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DynamicDashboardLayout title="Rapports simplifiés" breadcrumb="Rapports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rapports simplifiés</h1>
            <p className="text-gray-600 mt-1">
              Consultez vos rapports de performance et statistiques
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={generateRapport}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Générer rapport
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Stats générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'affaires total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStatsGenerales.chiffreAffaires.toLocaleString()} F CFA</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{mockStatsGenerales.evolutionMensuelle}</span> vs mois précédent
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total commandes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStatsGenerales.totalCommandes}</div>
              <p className="text-xs text-muted-foreground">
                Meilleur mois: {mockStatsGenerales.meilleurMois}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Livres vendus</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStatsGenerales.totalLivres}</div>
              <p className="text-xs text-muted-foreground">
                Discipline populaire: {mockStatsGenerales.disciplinePopulaire}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{mockStatsGenerales.evolutionMensuelle}</div>
              <p className="text-xs text-muted-foreground">
                Livre populaire: {mockStatsGenerales.livrePopulaire}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par titre ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les types</SelectItem>
                  <SelectItem value="mensuel">Mensuel</SelectItem>
                  <SelectItem value="trimestriel">Trimestriel</SelectItem>
                  <SelectItem value="annuel">Annuel</SelectItem>
                  <SelectItem value="automatique">Automatique</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  <SelectItem value="généré">Généré</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="erreur">Erreur</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={periodeFilter} onValueChange={setPeriodeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes périodes</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="Q4">Q4 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Résultats: {filteredRapports.length}
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chiffre d'affaires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Évolution
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRapports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Aucun rapport trouvé
                    </td>
                  </tr>
                ) : (
                  filteredRapports.map((rapport) => (
                    <tr key={rapport.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${getTypeColor(rapport.type)}`}>
                            {getTypeIcon(rapport.type)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {rapport.type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {rapport.titre}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {rapport.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rapport.periode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rapport.donnees.chiffreAffaires.toLocaleString()} F CFA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          rapport.donnees.evolution.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {rapport.donnees.evolution}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatutColor(rapport.statut)}>
                          {rapport.statut}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(rapport.dateCreation).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => viewDetails(rapport)}
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-800"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedRapport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {getTypeIcon(selectedRapport.type)}
                  {selectedRapport.titre}
                </h3>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">ID du rapport</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedRapport.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Période</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedRapport.periode}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Type</label>
                    <Badge className={`mt-1 ${getTypeColor(selectedRapport.type)}`}>
                      {selectedRapport.type}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Statut</label>
                    <Badge className={`mt-1 ${getStatutColor(selectedRapport.statut)}`}>
                      {selectedRapport.statut}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Données du rapport</label>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">Ventes totales</div>
                      <div className="text-lg font-semibold">{selectedRapport.donnees.ventesTotal.toLocaleString()} F CFA</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">Commandes totales</div>
                      <div className="text-lg font-semibold">{selectedRapport.donnees.commandesTotal}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">Livres vendus</div>
                      <div className="text-lg font-semibold">{selectedRapport.donnees.livresVendus}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">Évolution</div>
                      <div className={`text-lg font-semibold ${
                        selectedRapport.donnees.evolution.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedRapport.donnees.evolution}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Date de création</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(selectedRapport.dateCreation).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-600 border-gray-600 hover:bg-gray-50"
                >
                  Fermer
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DynamicDashboardLayout>
  )
}
