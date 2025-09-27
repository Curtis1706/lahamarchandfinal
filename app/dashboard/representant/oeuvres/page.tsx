"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Filter,
  Eye,
  Send,
  RotateCcw,
  BookOpen,
  User,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  MessageSquare
} from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface Work {
  id: string
  title: string
  description: string
  status: 'DRAFT' | 'PENDING' | 'UNDER_REVIEW' | 'PUBLISHED' | 'REJECTED'
  author: {
    id: string
    name: string
    email: string
  }
  discipline: {
    id: string
    name: string
  }
  project?: {
    id: string
    title: string
  }
  submittedAt: string
  reviewedAt?: string
  files: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
  rejectionReason?: string
  representativeNotes?: string
}

export default function OeuvresPage() {
  const [works, setWorks] = useState<Work[]>([])
  const [filteredWorks, setFilteredWorks] = useState<Work[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [disciplineFilter, setDisciplineFilter] = useState("all")
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showCorrectionModal, setShowCorrectionModal] = useState(false)
  const [selectedWork, setSelectedWork] = useState<Work | null>(null)
  const [disciplines, setDisciplines] = useState<any[]>([])
  const [reviewNotes, setReviewNotes] = useState("")

  // Load data
  useEffect(() => {
    loadWorks()
    loadDisciplines()
  }, [])

  // Filter works
  useEffect(() => {
    let filtered = works

    if (searchTerm) {
      filtered = filtered.filter(work =>
        work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(work => work.status === statusFilter)
    }

    if (disciplineFilter !== "all") {
      filtered = filtered.filter(work => work.discipline.id === disciplineFilter)
    }

    setFilteredWorks(filtered)
  }, [works, searchTerm, statusFilter, disciplineFilter])

  const loadWorks = async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getRepresentantWorks({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        disciplineId: disciplineFilter !== 'all' ? disciplineFilter : undefined
      })
      setWorks(data)
    } catch (error: any) {
      toast.error("Erreur lors du chargement des œuvres")
    } finally {
      setIsLoading(false)
    }
  }

  const loadDisciplines = async () => {
    try {
      const data = await apiClient.getDisciplines()
      setDisciplines(data)
    } catch (error: any) {
      toast.error("Erreur lors du chargement des disciplines")
    }
  }

  const handleTransmitToPDG = async (workId: string) => {
    try {
      await apiClient.transmitWorkToPDG(workId, reviewNotes)
      
      toast.success("Œuvre transmise au PDG avec succès")
      setShowReviewModal(false)
      setSelectedWork(null)
      setReviewNotes("")
      loadWorks()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la transmission")
    }
  }

  const handleRequestCorrection = async (workId: string, notes: string) => {
    try {
      await apiClient.requestWorkCorrection(workId, notes)
      
      toast.success("Demande de correction envoyée à l'auteur")
      setShowCorrectionModal(false)
      setSelectedWork(null)
      setReviewNotes("")
      loadWorks()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi de la demande")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge className="bg-gray-100 text-gray-800">Brouillon</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
      case 'UNDER_REVIEW':
        return <Badge className="bg-blue-100 text-blue-800">En révision</Badge>
      case 'PUBLISHED':
        return <Badge className="bg-green-100 text-green-800">Publié</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'UNDER_REVIEW':
        return <Eye className="h-4 w-4 text-blue-600" />
      case 'PUBLISHED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement des œuvres...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Œuvres</h1>
          <p className="text-gray-600">Validez et transmettez les œuvres de vos auteurs</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Œuvres</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{works.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{works.filter(w => w.status === 'PENDING').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Révision</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{works.filter(w => w.status === 'UNDER_REVIEW').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publiées</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{works.filter(w => w.status === 'PUBLISHED').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{works.filter(w => w.status === 'REJECTED').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher une œuvre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="UNDER_REVIEW">En révision</SelectItem>
            <SelectItem value="PUBLISHED">Publié</SelectItem>
            <SelectItem value="REJECTED">Rejeté</SelectItem>
          </SelectContent>
        </Select>
        <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Discipline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les disciplines</SelectItem>
            {disciplines.map((discipline) => (
              <SelectItem key={discipline.id} value={discipline.id}>
                {discipline.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Works List */}
      <div className="space-y-4">
        {filteredWorks.map((work) => (
          <Card key={work.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(work.status)}
                    <CardTitle className="text-lg">{work.title}</CardTitle>
                    {getStatusBadge(work.status)}
                  </div>
                  <CardDescription className="text-sm">
                    {work.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span>Auteur: {work.author.name}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span>Discipline: {work.discipline.name}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Soumis le {new Date(work.submittedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {work.files && (() => {
                    try {
                      const filesArray = JSON.parse(work.files);
                      return filesArray && filesArray.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FileText className="h-4 w-4 mr-2" />
                          <span>{filesArray.length} fichier(s)</span>
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>
                
                <div className="space-y-2">
                  {work.representativeNotes && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Notes du représentant:</p>
                      <p className="text-sm text-blue-700">{work.representativeNotes}</p>
                    </div>
                  )}
                  {work.rejectionReason && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-red-800">Raison du rejet:</p>
                      <p className="text-sm text-red-700">{work.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button variant="outline" size="sm">
                  <Eye className="h-3 w-3 mr-1" />
                  Consulter
                </Button>
                {work.files && (() => {
                  try {
                    const filesArray = JSON.parse(work.files);
                    return filesArray && filesArray.length > 0 && (
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-1" />
                        Télécharger
                      </Button>
                    );
                  } catch {
                    return null;
                  }
                })()}
                {work.status === 'PENDING' && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedWork(work)
                        setShowReviewModal(true)
                      }}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Transmettre au PDG
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedWork(work)
                        setShowCorrectionModal(true)
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Demander Correction
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Contacter Auteur
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorks.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune œuvre trouvée</h3>
          <p className="text-gray-600">Aucune œuvre ne correspond à vos critères de recherche.</p>
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transmettre au PDG</DialogTitle>
          </DialogHeader>
          {selectedWork && (
            <div className="space-y-4">
              <p>Voulez-vous transmettre l'œuvre <strong>"{selectedWork.title}"</strong> au PDG ?</p>
              <div>
                <Label htmlFor="notes">Notes pour le PDG (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Ajoutez des notes ou commentaires pour le PDG..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowReviewModal(false)}>
                  Annuler
                </Button>
                <Button onClick={() => handleTransmitToPDG(selectedWork.id)}>
                  Transmettre
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Correction Modal */}
      <Dialog open={showCorrectionModal} onOpenChange={setShowCorrectionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander une Correction</DialogTitle>
          </DialogHeader>
          {selectedWork && (
            <div className="space-y-4">
              <p>Quelles corrections souhaitez-vous demander à l'auteur pour <strong>"{selectedWork.title}"</strong> ?</p>
              <div>
                <Label htmlFor="correction-notes">Détails des corrections *</Label>
                <Textarea
                  id="correction-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Décrivez précisément les corrections à apporter..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCorrectionModal(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={() => handleRequestCorrection(selectedWork.id, reviewNotes)}
                  disabled={!reviewNotes.trim()}
                >
                  Envoyer la Demande
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
