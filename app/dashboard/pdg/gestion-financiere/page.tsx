"use client";

import { useState, useEffect } from "react";
;
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  PieChart,
  FileText,
  Download,
  Calendar,
  Users,
  Package,
  BookOpen,
  Building2,
  RefreshCw,
  Filter,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";

interface FinancialOverview {
  totalRevenue: number;
  totalOrders: number;
  totalWorks: number;
  totalPartners: number;
  avgOrderValue: number;
  recentOrders: Array<{
    id: string;
    status: string;
    total: number;
    itemCount: number;
    createdAt: string;
    customerName: string;
  }>;
  topWorks: TopWork[];
  monthlyTrends: MonthlyTrend[];
  disciplineRevenue: { [key: string]: number };
}

interface MonthlyTrend {
  month: string;
  revenue: number;
  orders: number;
}

interface DisciplineRevenue {
  [key: string]: number;
}

interface TopWork {
  work: {
    id: string;
    title: string;
    isbn: string;
    price: number;
    discipline: {
      name: string;
    };
    author?: {
      name: string;
    };
  } | null;
  totalSold: number;
  totalRevenue: number;
  orderCount: number;
}

interface SalesReport {
  orders: Array<{
    id: string;
    createdAt: string;
    status: string;
    totalAmount: number;
    itemsCount: number;
    partner: any;
    user: any;
    items: any[];
  }>;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalItems: number;
    avgOrderValue: number;
  };
}

interface Royalty {
  id: string;
  amount: number;
  paid: boolean;
  createdAt: string;
  work: {
    title: string;
    discipline: {
      name: string;
    };
    author: {
      name: string;
    };
    concepteur: {
      name: string;
    };
  };
  user: {
    name: string;
    email: string;
  };
}

interface PartnerPerformance {
  partnerId: string;
  partnerName: string;
  partnerType: string;
  ordersCount: number;
  totalRevenue: number;
  totalItems: number;
  avgOrderValue: number;
  userStatus: string;
}

export default function GestionFinancierePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd")
  });
  const [disciplineFilter, setDisciplineFilter] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");

  // États pour les données
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [disciplineRevenue, setDisciplineRevenue] = useState<DisciplineRevenue>({});
  const [topWorks, setTopWorks] = useState<TopWork[]>([]);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [partnerPerformance, setPartnerPerformance] = useState<PartnerPerformance[]>([]);

  useEffect(() => {
    loadFinancialData();
  }, [activeTab, dateRange, disciplineFilter, partnerFilter]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case "overview":
          await loadOverviewData();
          break;
        case "sales":
          await loadSalesData();
          break;
        case "royalties":
          await loadRoyaltiesData();
          break;
        case "partners":
          await loadPartnerPerformanceData();
          break;
      }
    } catch (error) {
      console.error("Error loading financial data:", error);
      toast.error("Erreur lors du chargement des données financières");
    } finally {
      setLoading(false);
    }
  };

  const loadOverviewData = async () => {
    try {
      const params = new URLSearchParams({
        type: "overview",
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await fetch(`/api/finance?${params}`);
      const data = await response.json();

      if (response.ok) {
        setOverview(data);
        setMonthlyTrends(data.monthlyTrends || []);
        setDisciplineRevenue(data.disciplineRevenue || {});
        setTopWorks(data.topWorks || []);
      } else {
        toast.error(data.error || "Erreur lors du chargement des données");
      }
    } catch (error) {
      console.error("Error loading overview data:", error);
      toast.error("Erreur lors du chargement des données");
    }
  };

  const loadSalesData = async () => {
    try {
      const params = new URLSearchParams({
        type: "sales",
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      if (disciplineFilter) params.append("disciplineId", disciplineFilter);
      if (partnerFilter) params.append("partnerId", partnerFilter);

      const response = await fetch(`/api/finance?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSalesReport(data);
      } else {
        toast.error(data.error || "Erreur lors du chargement des données de vente");
      }
    } catch (error) {
      console.error("Error loading sales data:", error);
      toast.error("Erreur lors du chargement des données de vente");
    }
  };

  const loadRoyaltiesData = async () => {
    try {
      const params = new URLSearchParams({
        type: "royalties",
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await fetch(`/api/finance?${params}`);
      const data = await response.json();

      if (response.ok) {
        setRoyalties(data.recentRoyalties || []);
      } else {
        toast.error(data.error || "Erreur lors du chargement des données de royalties");
      }
    } catch (error) {
      console.error("Error loading royalties data:", error);
      toast.error("Erreur lors du chargement des données de royalties");
    }
  };

  const loadPartnerPerformanceData = async () => {
    try {
      const params = new URLSearchParams({
        type: "partner_performance",
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await fetch(`/api/finance?${params}`);
      const data = await response.json();

      if (response.ok) {
        setPartnerPerformance(data.partners || []);
      } else {
        toast.error(data.error || "Erreur lors du chargement des données de performance");
      }
    } catch (error) {
      console.error("Error loading partner performance data:", error);
      toast.error("Erreur lors du chargement des données de performance");
    }
  };

  const exportReport = async () => {
    try {
      const params = new URLSearchParams({
        type: activeTab,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format: "csv"
      });

      const response = await fetch(`/api/finance/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rapport-financier-${activeTab}-${dateRange.startDate}-${dateRange.endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success("Rapport exporté avec succès");
      } else {
        toast.error("Erreur lors de l'export du rapport");
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Erreur lors de l'export du rapport");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: "En attente", variant: "secondary" as const },
      VALIDATED: { label: "Validée", variant: "default" as const },
      PROCESSING: { label: "En cours", variant: "default" as const },
      SHIPPED: { label: "Expédiée", variant: "default" as const },
      DELIVERED: { label: "Livrée", variant: "default" as const },
      CANCELLED: { label: "Annulée", variant: "destructive" as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const
    };

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filtres et Options</span>
              <div className="flex items-center space-x-2">
                <Button onClick={loadFinancialData} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
                <Button onClick={exportReport} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discipline">Discipline</Label>
                <Input
                  id="discipline"
                  placeholder="Filtrer par discipline"
                  value={disciplineFilter}
                  onChange={(e) => setDisciplineFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner">Partenaire</Label>
                <Input
                  id="partner"
                  placeholder="Filtrer par partenaire"
                  value={partnerFilter}
                  onChange={(e) => setPartnerFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Ventes</span>
            </TabsTrigger>
            <TabsTrigger value="royalties" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Royalties</span>
            </TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Partenaires</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {overview && (
              <>
                {/* Métriques principales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                          <p className="text-2xl font-bold">{(overview?.totalRevenue || 0).toLocaleString()} FCFA</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Commandes</p>
                          <p className="text-2xl font-bold">{overview?.totalOrders || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Panier moyen</p>
                          <p className="text-2xl font-bold">{(overview?.avgOrderValue || 0).toFixed(2)} FCFA</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top œuvres vendues */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5" />
                      <span>Top œuvres vendues</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Œuvre</TableHead>
                          <TableHead>Discipline</TableHead>
                          <TableHead>Quantité vendue</TableHead>
                          <TableHead>Prix unitaire</TableHead>
                          <TableHead>Chiffre d'affaires</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topWorks && topWorks.length > 0 ? (
                          topWorks.map((work, index) => (
                            <TableRow key={work.work?.id || index}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{work.work?.title || 'Œuvre inconnue'}</div>
                                  <div className="text-sm text-gray-500">ISBN: {work.work?.isbn || 'N/A'}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{work.work?.discipline?.name || 'Non définie'}</Badge>
                              </TableCell>
                              <TableCell>{work.totalSold || 0}</TableCell>
                              <TableCell>{work.work?.price ? work.work.price.toFixed(2) : '0.00'} FCFA</TableCell>
                              <TableCell className="font-medium">
                                {(work.totalRevenue || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FCFA
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                              Aucune œuvre vendue pour le moment
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Ventes par discipline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart className="h-5 w-5" />
                      <span>Ventes par discipline</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(disciplineRevenue).length > 0 ? (
                        Object.entries(disciplineRevenue).map(([discipline, revenue]) => (
                          <div key={discipline} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">{discipline}</div>
                              <div className="text-sm text-gray-500">
                                Revenus de cette discipline
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{(revenue || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FCFA</div>
                              <div className="text-sm text-gray-500">
                                {overview?.totalRevenue && overview.totalRevenue > 0 ? (((revenue || 0) / overview.totalRevenue) * 100).toFixed(1) : 0}%
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Aucune donnée de vente par discipline disponible
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            {salesReport && (
              <>
                {/* Résumé des ventes */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                          <p className="text-2xl font-bold">{(salesReport?.summary?.totalRevenue || 0).toLocaleString()} FCFA</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Commandes</p>
                          <p className="text-2xl font-bold">{salesReport?.summary?.totalOrders || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Articles</p>
                          <p className="text-2xl font-bold">{salesReport?.summary?.totalItems || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Panier moyen</p>
                          <p className="text-2xl font-bold">{(salesReport?.summary?.avgOrderValue || 0).toFixed(2)} FCFA</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Détail des commandes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Détail des commandes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Commande</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Articles</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(salesReport?.orders || []).map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              #{order.id.substring(0, 8).toUpperCase()}
                            </TableCell>
                            <TableCell>
                              {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: fr })}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.user?.name || 'N/A'}</div>
                                <div className="text-sm text-gray-500">{order.user?.email || 'N/A'}</div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>{order.itemsCount || 0}</TableCell>
                            <TableCell className="font-medium">
                              {(order.totalAmount || 0).toFixed(2)} FCFA
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="royalties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Royalties récentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Œuvre</TableHead>
                      <TableHead>Discipline</TableHead>
                      <TableHead>Bénéficiaire</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(royalties || []).map((royalty) => (
                      <TableRow key={royalty.id}>
                        <TableCell className="font-medium">{royalty.work?.title || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{royalty.work?.discipline?.name || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{royalty.user?.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{royalty.user?.email || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {royalty.work?.author ? "Auteur" : "Concepteur"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {(royalty.amount || 0).toFixed(2)} FCFA
                        </TableCell>
                        <TableCell>
                          <Badge variant={royalty.paid ? "default" : "secondary"}>
                            {royalty.paid ? "Payé" : "En attente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(royalty.createdAt), "dd/MM/yyyy", { locale: fr })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partners" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Performance des partenaires</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partenaire</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Commandes</TableHead>
                      <TableHead>Chiffre d'affaires</TableHead>
                      <TableHead>Panier moyen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(partnerPerformance || []).map((partner) => (
                      <TableRow key={partner.partnerId}>
                        <TableCell className="font-medium">{partner.partnerName || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{partner.partnerType || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(partner.userStatus)}</TableCell>
                        <TableCell>{partner.ordersCount || 0}</TableCell>
                        <TableCell className="font-medium">
                          {(partner.totalRevenue || 0).toFixed(2)} FCFA
                        </TableCell>
                        <TableCell>{(partner.avgOrderValue || 0).toFixed(2)} FCFA</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}