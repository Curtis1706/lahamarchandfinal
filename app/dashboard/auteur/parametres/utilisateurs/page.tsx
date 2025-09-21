"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, UserCheck, UserX, RefreshCw, Maximize2 } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

const mockUsers = [
  {
    id: 1,
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@entreprise.fr",
    role: "PDG",
    statut: "Actif",
    derniere_connexion: "2024-01-15 14:30",
  },
  {
    id: 2,
    nom: "Martin",
    prenom: "Marie",
    email: "marie.martin@entreprise.fr",
    role: "Manager",
    statut: "Actif",
    derniere_connexion: "2024-01-15 09:15",
  },
  {
    id: 3,
    nom: "Bernard",
    prenom: "Pierre",
    email: "pierre.bernard@entreprise.fr",
    role: "Employé",
    statut: "Inactif",
    derniere_connexion: "2024-01-10 16:45",
  },
  {
    id: 4,
    nom: "Dubois",
    prenom: "Sophie",
    email: "sophie.dubois@entreprise.fr",
    role: "Manager",
    statut: "Actif",
    derniere_connexion: "2024-01-15 11:20",
  },
  {
    id: 5,
    nom: "Moreau",
    prenom: "Luc",
    email: "luc.moreau@entreprise.fr",
    role: "Employé",
    statut: "Actif",
    derniere_connexion: "2024-01-14 17:30",
  },
]

export default function UtilisateursPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const handleRefresh = () => {
    console.log("[v0] Refreshing users...")
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  return (
    <DashboardLayout title="Gestion des utilisateurs" breadcrumb="Tableau de bord - Utilisateurs" >
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Liste des utilisateurs</h2>
            <div className="flex items-center space-x-2">
              <button onClick={handleRefresh} className="p-2 hover:bg-gray-100 rounded-lg" title="Actualiser">
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
              <button onClick={handleFullscreen} className="p-2 hover:bg-gray-100 rounded-lg" title="Agrandir">
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Add User Button */}
            <div className="flex justify-end mb-6">
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un utilisateur
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Ajouter un utilisateur</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nom">Nom</Label>
                        <Input id="nom" placeholder="Nom" />
                      </div>
                      <div>
                        <Label htmlFor="prenom">Prénom</Label>
                        <Input id="prenom" placeholder="Prénom" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="email@entreprise.fr" />
                    </div>
                    <div>
                      <Label htmlFor="role">Rôle</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PDG">PDG</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Employé">Employé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="password">Mot de passe temporaire</Label>
                      <Input id="password" type="password" placeholder="••••••••" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                        Annuler
                      </Button>
                      <Button className="bg-indigo-600 hover:bg-indigo-700">Créer l'utilisateur</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="PDG">PDG</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Employé">Employé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.prenom} {user.nom}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "PDG" ? "default" : user.role === "Manager" ? "secondary" : "outline"}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.statut === "Actif" ? "default" : "destructive"}>
                        {user.statut === "Actif" ? (
                          <>
                            <UserCheck className="w-3 h-3 mr-1" /> Actif
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3 mr-1" /> Inactif
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{user.derniere_connexion}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
