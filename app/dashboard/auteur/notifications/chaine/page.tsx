"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, Maximize2, Edit, Power } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

interface NotificationChain {
  client: string
  titre: string
  date: string
  statut: "Actif" | "Désactivé"
  creeeLe: string
  creePar: string
  actions: string[]
}

const mockChains: NotificationChain[] = [
  {
    client: "ECOLE CONTRATUELLE (+2299451975)",
    titre: "Commande : 2025COM28",
    date: "dim. 21 sept. 2025 08:30",
    statut: "Désactivé",
    creeeLe: "ven. 22 août 2025 18:27",
    creePar: "support@lahamarchand.com",
    actions: ["edit", "delete", "power"],
  },
  {
    client: "ECOLE CONTRATUELLE (+2299451975)",
    titre: "Test de notification",
    date: "lun. 25 août 2025 08:00",
    statut: "Actif",
    creeeLe: "ven. 22 août 2025 18:17",
    creePar: "support@lahamarchand.com",
    actions: ["edit", "delete", "power"],
  },
  {
    client: "ECOLE CONTRATUELLE (+2299451975)",
    titre: "Test",
    date: "lun. 25 août 2025 08:00",
    statut: "Actif",
    creeeLe: "jeu. 21 août 2025 17:51",
    creePar: "billfass2010@gmail.com",
    actions: ["edit", "delete", "power"],
  },
]

export default function NotificationChainePage() {
  const [chains, setChains] = useState<NotificationChain[]>(mockChains)
  const [showChainModal, setShowChainModal] = useState(false)
  const [formData, setFormData] = useState({
    titre: "",
    client: "",
    date: "",
    heure: "",
    envoyeUnSMS: "Oui",
    envoyeUnMail: "Oui",
    nombreDeJoursAvant: "1",
    statut: "Actif",
    message: "",
  })

  const handleRefresh = () => {
    console.log("[v0] Refreshing chains...")
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleCreateChain = () => {
    console.log("[v0] Creating chain:", formData)
    setShowChainModal(false)
    setFormData({
      titre: "",
      client: "",
      date: "",
      heure: "",
      envoyeUnSMS: "Oui",
      envoyeUnMail: "Oui",
      nombreDeJoursAvant: "1",
      statut: "Actif",
      message: "",
    })
  }

  return (
    <DashboardLayout title="" >
            <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Les chaînes de notification</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Clients
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header Section */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Select defaultValue="tous-clients">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous-clients">Tous les clients</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="tous-statuts">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous-statuts">Tous les statuts</SelectItem>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="desactive">Désactivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setShowChainModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
                Chaîne +
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Afficher</span>
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
                    CLIENT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TITRE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DATE
                    <button className="ml-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CRÉÉ LE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CRÉÉ PAR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chains.map((chain, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        {chain.client}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{chain.titre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{chain.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={chain.statut === "Actif" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {chain.statut}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{chain.creeeLe}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{chain.creePar}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button className="text-yellow-600 hover:text-yellow-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                        </button>
                        <button className="text-green-600 hover:text-green-800">
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Affichage de 1 à 3 sur 3 éléments</p>
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

      {/* Chain Modal */}
      <Dialog open={showChainModal} onOpenChange={setShowChainModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chaîne de notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre :</Label>
                <Input
                  id="titre"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  placeholder="Titre de la chaîne"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client :</Label>
                <Select value={formData.client} onValueChange={(value) => setFormData({ ...formData, client: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecole">ECOLE CONTRATUELLE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date :</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  defaultValue="2025-09-22"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heure">Heure :</Label>
                <Input
                  id="heure"
                  type="time"
                  value={formData.heure}
                  onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                  defaultValue="08:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms">Envoyé un SMS :</Label>
                <Select
                  value={formData.envoyeUnSMS}
                  onValueChange={(value) => setFormData({ ...formData, envoyeUnSMS: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oui">Oui</SelectItem>
                    <SelectItem value="Non">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mail">Envoyé un Mail :</Label>
                <Select
                  value={formData.envoyeUnMail}
                  onValueChange={(value) => setFormData({ ...formData, envoyeUnMail: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oui">Oui</SelectItem>
                    <SelectItem value="Non">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jours">Nombre de jours avant :</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="jours"
                    type="number"
                    value={formData.nombreDeJoursAvant}
                    onChange={(e) => setFormData({ ...formData, nombreDeJoursAvant: e.target.value })}
                    className="w-16"
                  />
                  <span className="text-sm text-gray-600">jour(s)</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="statut">Statut :</Label>
                <Select value={formData.statut} onValueChange={(value) => setFormData({ ...formData, statut: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message à envoyer :</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Message"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowChainModal(false)}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Fermer
            </Button>
            <Button onClick={handleCreateChain} className="bg-indigo-600 hover:bg-indigo-700">
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
