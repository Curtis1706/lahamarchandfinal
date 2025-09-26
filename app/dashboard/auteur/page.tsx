"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  Edit,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiClient } from "@/lib/api-client";

interface Work {
  id: string;
  title: string;
  isbn: string;
  price: number;
  stock: number;
  status: string;
  createdAt: string;
  publishedAt: string;
  discipline: {
    id: string;
    name: string;
  };
  author: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    title: string;
    status: string;
  };
  _count: {
    orderItems: number;
    sales: number;
  };
}

interface Discipline {
  id: string;
  name: string;
}

export default function AuteurDashboardPage() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const [works, setWorks] = useState<Work[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulaire de création d'œuvre
  const [formData, setFormData] = useState({
    title: "",
    isbn: "",
    price: "",
    stock: "",
    disciplineId: "",
    description: ""
  });

  useEffect(() => {
    if (user && user.role === "AUTEUR") {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [worksData, disciplinesData] = await Promise.all([
        apiClient.getAuthorWorks(user?.id || ""),
        apiClient.getDisciplines()
      ]);

      console.log("🔍 Données reçues:", { worksData, disciplinesData });

      setWorks(Array.isArray(worksData.works) ? worksData.works : []);
      setDisciplines(Array.isArray(disciplinesData) ? disciplinesData : []);
    } catch (error) {
      console.error("❌ Erreur lors du chargement des données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWork = async () => {
    if (!formData.title || !formData.isbn || !formData.disciplineId) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const workData = {
        title: formData.title,
        isbn: formData.isbn,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0,
        disciplineId: formData.disciplineId,
        authorId: user?.id,
        status: "PENDING" // Soumission directe pour validation PDG
      };

      console.log("🔍 Création d'œuvre:", workData);

      const newWork = await apiClient.createAuthorWork(workData);
      
      console.log("✅ Œuvre créée:", newWork);
      
      toast.success("Œuvre soumise avec succès pour validation");
      setIsCreateDialogOpen(false);
      setFormData({
        title: "",
        isbn: "",
        price: "",
        stock: "",
        disciplineId: "",
        description: ""
      });
      
      // Recharger les données
      await fetchData();
      
    } catch (error: any) {
      console.error("❌ Erreur création œuvre:", error);
      toast.error(error.message || "Erreur lors de la création de l'œuvre");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case "PUBLISHED":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Publié</Badge>;
      case "REJECTED":
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>;
      case "DRAFT":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800"><FileText className="h-3 w-3 mr-1" />Brouillon</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "PUBLISHED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "DRAFT":
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Filtrage
  const filteredWorks = works.filter(work => {
    const matchesSearch = work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         work.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         work.discipline.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || work.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Statistiques
  const stats = {
    total: works.length,
    pending: works.filter(w => w.status === "PENDING").length,
    published: works.filter(w => w.status === "PUBLISHED").length,
    rejected: works.filter(w => w.status === "REJECTED").length,
    draft: works.filter(w => w.status === "DRAFT").length
  };

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BookOpen className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de vos œuvres...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "AUTEUR") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Accès non autorisé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mes Œuvres</h1>
            <p className="text-muted-foreground">
              Gérez vos œuvres et suivez leur statut de validation
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Œuvre
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle œuvre</DialogTitle>
                <DialogDescription>
                  Soumettez votre œuvre pour validation par l'équipe éditoriale
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      placeholder="Titre de l'œuvre"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="isbn">ISBN *</Label>
                    <Input
                      id="isbn"
                      placeholder="978-1234567890"
                      value={formData.isbn}
                      onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Prix (FCFA)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
              </div>
                  <div>
                    <Label htmlFor="stock">Stock initial</Label>
                    <Input
                      id="stock"
                      type="number"
                      placeholder="0"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    />
        </div>
      </div>
          <div>
                  <Label htmlFor="discipline">Discipline *</Label>
                  <Select value={formData.disciplineId} onValueChange={(value) => setFormData(prev => ({ ...prev, disciplineId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplines.map((discipline) => (
                        <SelectItem key={discipline.id} value={discipline.id}>
                          {discipline.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
          </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Description de l'œuvre..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
        </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateWork} disabled={isSubmitting}>
                    {isSubmitting ? "Soumission..." : "Soumettre pour validation"}
                  </Button>
            </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Publiées</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans vos œuvres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="PUBLISHED">Publié</SelectItem>
              <SelectItem value="REJECTED">Rejeté</SelectItem>
              <SelectItem value="DRAFT">Brouillon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des œuvres */}
        {filteredWorks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune œuvre trouvée</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || statusFilter !== "all"
                  ? "Essayez de modifier vos critères de recherche"
                  : "Vous n'avez pas encore créé d'œuvre"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredWorks.map((work) => (
              <Card key={work.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(work.status)}
            </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{work.title}</h3>
                        {getStatusBadge(work.status)}
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <FileText className="h-4 w-4" />
                            <span>ISBN: {work.isbn}</span>
                    </div>

                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>Discipline: {work.discipline.name}</span>
            </div>
          </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Créé le {format(new Date(work.createdAt), "dd/MM/yyyy", { locale: fr })}
                            </span>
      </div>

                          {work.status === "PUBLISHED" && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-4 w-4" />
                              <span>
                                Publié le {format(new Date(work.publishedAt), "dd/MM/yyyy", { locale: fr })}
                              </span>
          </div>
                          )}
        </div>

                        <div className="flex items-center space-x-4">
                          <span>Prix: {work.price.toLocaleString()} FCFA</span>
                          <span>Stock: {work.stock}</span>
                          <span>Commandes: {work._count.orderItems}</span>
                          <span>Ventes: {work._count.sales}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                      {work.status === "DRAFT" && (
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
            )}
          </div>
        </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}