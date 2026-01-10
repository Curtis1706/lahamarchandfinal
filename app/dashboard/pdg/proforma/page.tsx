"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import {
  Plus,
  Filter,
  Calendar,
  Printer,
  Download,
  Search,
  X,
  Mail,
  CheckCircle,
  XCircle,
  ArrowRight,
  Eye,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface Work {
  id: string;
  title: string;
  isbn?: string;
  price: number;
  stock: number;
  tva?: number;
  discipline?: {
    name: string;
  };
  category?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface Partner {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  type?: string;
}

interface ProformaItem {
  id?: string;
  bookId: string;
  workId?: string;
  work?: {
    id: string;
    title: string;
    isbn?: string;
    price: number;
  } | null;
  reference?: string | null;
  isbn?: string | null;
  title: string;
  authorName?: string | null;
  quantity: number;
  unitPriceHT: number;
  discountRate: number;
  tvaRate: number;
  lineHT: number;
  lineDiscount: number;
  lineTaxable: number;
  lineTVA: number;
  totalTTC: number;
}

interface Proforma {
  id: string;
  proformaNumber: string;
  country: string;
  currency: "XOF" | "XAF" | "FCFA";
  clientType: "ECOLE" | "PARTENAIRE" | "CLIENT" | "INVITE";
  clientId?: string | null;
  partnerId?: string | null;
  userId?: string | null;
  client?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  } | null;
  partner?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  } | null;
  user?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
  } | null;
  clientSnapshot?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  } | null;
  items: ProformaItem[];
  subtotalHT: number;
  discountTotal: number;
  taxableBase: number;
  tvaTotal: number;
  totalTTC: number;
  total?: number; // Legacy
  status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
  issuedAt: string;
  validUntil: string;
  acceptedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  promoCode?: string | null;
  promoDiscountRate?: number | null;
  orderType?: string | null;
  notes?: string | null;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email?: string;
  } | null;
  orderId?: string | null;
  invoiceId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProformaPage() {
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filtres
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Formulaire de création - Étape 1
  const [clientType, setClientType] = useState<"ECOLE" | "PARTENAIRE" | "CLIENT" | "INVITE">("CLIENT");
  const [clientId, setClientId] = useState("");
  const [manualClientName, setManualClientName] = useState("");
  const [manualClientEmail, setManualClientEmail] = useState("");
  const [manualClientPhone, setManualClientPhone] = useState("");
  const [manualClientAddress, setManualClientAddress] = useState("");
  const [country, setCountry] = useState("Gabon");
  const [currency, setCurrency] = useState<"XOF" | "XAF" | "FCFA">("FCFA");
  const [validUntil, setValidUntil] = useState<Date | undefined>(undefined);
  const [orderType, setOrderType] = useState("");
  const [notes, setNotes] = useState("");

  // Formulaire de création - Étape 2
  const [items, setItems] = useState<Array<{
    bookId: string;
    quantity: number;
    unitPriceHT?: number;
    discountRate?: number;
    tvaRate?: number;
  }>>([]);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPriceHT, setUnitPriceHT] = useState("");
  const [discountRate, setDiscountRate] = useState("");
  const [tvaRate, setTvaRate] = useState("18");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscountRate, setPromoDiscountRate] = useState("");

  // Recherche de livre (combobox)
  const [bookSearchTerm, setBookSearchTerm] = useState("");
  const [isBookComboboxOpen, setIsBookComboboxOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [worksData, usersData, partnersData, proformasData] = await Promise.all([
        apiClient.getWorks({ status: "PUBLISHED" }),
        apiClient.getUsers(),
        apiClient.getPartners().catch(() => []),
        apiClient.getPDGProformas().catch(() => ({ proformas: [] })),
      ]);

      setWorks(Array.isArray(worksData) ? worksData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setPartners(Array.isArray(partnersData) ? partnersData : []);

      if (proformasData && typeof proformasData === 'object') {
        const proformasList = Array.isArray((proformasData as any).proformas)
          ? (proformasData as any).proformas
          : Array.isArray(proformasData)
          ? proformasData
          : [];
        setProformas(proformasList as Proforma[]);
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les livres selon le terme de recherche
  const filteredWorksForSelection = useMemo(() => {
    if (!bookSearchTerm.trim()) {
      return works;
    }
    const searchLower = bookSearchTerm.toLowerCase().trim();
    return works.filter(
      (work) =>
        work.title?.toLowerCase().includes(searchLower) ||
        work.isbn?.toLowerCase().includes(searchLower)
    );
  }, [works, bookSearchTerm]);

  // Calculer les totaux
  const calculateTotals = useCallback((itemsList: Array<{
    bookId: string;
    quantity: number;
    unitPriceHT?: number;
    discountRate?: number;
    tvaRate?: number;
  }>) => {
    let subtotalHT = 0;
    let totalDiscount = 0;
    let taxableBase = 0;
    let tvaTotal = 0;

    itemsList.forEach((item) => {
      const work = works.find((w) => w.id === item.bookId);
      const unitPrice = item.unitPriceHT || work?.price || 0;
      const qty = item.quantity || 0;
      const discountRate = (item.discountRate || 0) / 100;
      const tvaRate = (item.tvaRate || work?.tva || 18) / 100;

      const lineHT = unitPrice * qty;
      const lineDiscount = lineHT * discountRate;
      const lineTaxable = lineHT - lineDiscount;
      const lineTVA = lineTaxable * tvaRate;

      subtotalHT += lineHT;
      totalDiscount += lineDiscount;
      taxableBase += lineTaxable;
      tvaTotal += lineTVA;
    });

    return {
      subtotalHT,
      discountTotal: totalDiscount,
      taxableBase,
      tvaTotal,
      totalTTC: taxableBase + tvaTotal,
    };
  }, [works]);

  const totals = useMemo(() => {
    const base = calculateTotals(items);

    // Remise promo (sur subtotalHT)
    const promoDiscount = promoDiscountRate
      ? (base.subtotalHT * parseFloat(promoDiscountRate) / 100)
      : 0;

    const taxableBaseAfterPromo = base.taxableBase - promoDiscount; // base taxable après remise promo

    // TVA recalculée par prorata sur chaque ligne taxable (propre)
    const ratio = base.taxableBase > 0 ? taxableBaseAfterPromo / base.taxableBase : 1;

    const tvaTotalAfterPromo = items.reduce((sum, it) => {
      const work = works.find((w) => w.id === it.bookId);
      const unitPrice = it.unitPriceHT || work?.price || 0;
      const qty = it.quantity || 0;
      const discountRate = (it.discountRate || 0) / 100;
      const tvaRate = (it.tvaRate || work?.tva || 18) / 100;

      const lineHT = unitPrice * qty;
      const lineDiscount = lineHT * discountRate;
      const lineTaxable = lineHT - lineDiscount;
      const lineTVA = lineTaxable * tvaRate;

      return sum + (lineTVA * ratio);
    }, 0);

    const totalTTC = taxableBaseAfterPromo + tvaTotalAfterPromo;

    return {
      subtotalHT: base.subtotalHT,
      discountTotal: base.discountTotal + promoDiscount,
      taxableBase: taxableBaseAfterPromo,
      tvaTotal: tvaTotalAfterPromo,
      totalTTC,
    };
  }, [items, promoDiscountRate, calculateTotals, works]);

  const handleAddItem = () => {
    if (!selectedBookId || !quantity) {
      toast.error("Sélectionnez un livre et saisissez une quantité");
      return;
    }

    const work = works.find((w) => w.id === selectedBookId);
    if (!work) return;

    const qty = parseInt(quantity);
    if (qty <= 0) {
      toast.error("La quantité doit être supérieure à 0");
      return;
    }

    const unitPrice = unitPriceHT ? parseFloat(unitPriceHT) : work.price;
    if (unitPrice <= 0) {
      toast.error("Le prix doit être supérieur à 0");
      return;
    }

    const discount = discountRate ? parseFloat(discountRate) : 0;
    const tva = tvaRate ? parseFloat(tvaRate) : work.tva || 18;

    setItems([
      ...items,
      {
        bookId: selectedBookId,
        quantity: qty,
        unitPriceHT: unitPrice,
        discountRate: discount,
        tvaRate: tva,
      },
    ]);

    setSelectedBookId("");
    setQuantity("");
    setUnitPriceHT("");
    setDiscountRate("");
    setTvaRate("18");
    setBookSearchTerm("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateStep(1);
    setClientType("CLIENT");
    setClientId("");
    setManualClientName("");
    setManualClientEmail("");
    setManualClientPhone("");
    setManualClientAddress("");
    setCountry("Gabon");
    setCurrency("FCFA");
    setValidUntil(undefined);
    setOrderType("");
    setNotes("");
    setItems([]);
    setPromoCode("");
    setPromoDiscountRate("");
    setBookSearchTerm("");
  };

  const handleCreateProforma = async (mode: "DRAFT" | "SEND" = "DRAFT") => {
    // Valider selon le type de client
    if (clientType !== "INVITE") {
      if (!clientId || clientId.trim() === "") {
        const clientTypeLabel = clientType === "ECOLE" ? "école" : clientType === "PARTENAIRE" ? "partenaire" : "client";
        toast.error(`Sélectionnez un ${clientTypeLabel}`);
        return;
      }
    } else {
      if (!manualClientName || manualClientName.trim() === "") {
        toast.error("Saisissez le nom du client invité");
        return;
      }
    }

    if (!validUntil) {
      toast.error("Sélectionnez une date de validité");
      return;
    }

    if (items.length === 0) {
      toast.error("Ajoutez au moins un livre au proforma");
      return;
    }

    try {
      // Mapper les champs selon le type de client pour l'API
      const payload: any = {
        clientType,
        country,
        currency,
        validUntil: validUntil.toISOString(),
        items: items.map(item => {
          const work = works.find((w) => w.id === item.bookId);
          return {
            workId: item.bookId, // L'API attend workId, pas bookId
            bookId: item.bookId, // Pour compatibilité
            quantity: item.quantity,
            unitPriceHT: item.unitPriceHT,
            discountRate: item.discountRate ? item.discountRate / 100 : undefined,
            tvaRate: item.tvaRate ? item.tvaRate / 100 : undefined,
            title: work?.title,
            isbn: work?.isbn,
          };
        }),
        promoCode: promoCode || undefined,
        promoDiscountRate: promoDiscountRate ? parseFloat(promoDiscountRate) / 100 : undefined,
        orderType: orderType || undefined,
        notes: notes || undefined,
      };

      // Ajouter les champs spécifiques selon le type de client
      if (clientType === "PARTENAIRE") {
        if (!clientId || clientId.trim() === "") {
          toast.error("Sélectionnez un partenaire");
          return;
        }
        payload.partnerId = clientId.trim();
      } else if (clientType === "CLIENT" || clientType === "ECOLE") {
        if (!clientId || clientId.trim() === "") {
          const clientTypeLabel = clientType === "ECOLE" ? "école" : "client";
          toast.error(`Sélectionnez un ${clientTypeLabel}`);
          return;
        }
        payload.userId = clientId.trim();
      } else if (clientType === "INVITE") {
        if (!manualClientName || manualClientName.trim() === "") {
          toast.error("Saisissez le nom du client invité");
          return;
        }
        payload.clientName = manualClientName.trim();
        payload.clientEmail = manualClientEmail?.trim() || undefined;
        payload.clientPhone = manualClientPhone?.trim() || undefined;
        payload.clientAddress = manualClientAddress?.trim() || undefined;
        payload.clientCity = undefined; // Pas de champ city dans le formulaire
        payload.clientCountry = country;
      }

      // Ajouter le statut initial selon le mode
      payload.initialStatus = mode === "SEND" ? "SENT" : "DRAFT";

      const response = await apiClient.createProforma(payload);

      const data = response as any;

      if (data && !(data instanceof Error)) {
        const created: Proforma = data.proforma || data;

        if (mode === "SEND") {
          toast.success(data.message || "Proforma créé et envoyé avec succès");
        } else {
          toast.success(data.message || "Proforma créé avec succès");
        }

        handleCloseCreateModal();
        loadData();
      } else {
        toast.error((data as any)?.error || "Erreur lors de la création du proforma");
      }
    } catch (error: any) {
      console.error("Erreur lors de la création:", error);
      toast.error(error.message || "Erreur lors de la création du proforma");
    }
  };

  const handleProformaAction = async (
    proformaId: string,
    action: "send" | "accept" | "expire" | "cancel" | "convert",
    reason?: string
  ) => {
    try {
      await apiClient.updateProforma(proformaId, {
        action,
        ...(reason && { cancellationReason: reason }),
      });

      toast.success(`Proforma ${action === "send" ? "envoyé" : action === "accept" ? "accepté" : action === "convert" ? "converti" : "annulé"} avec succès`);
      loadData();
      if (showDetailsModal) {
        setShowDetailsModal(false);
      }
    } catch (error: any) {
      console.error(`Erreur lors de l'action ${action}:`, error);
      toast.error(error.message || `Erreur lors de l'action ${action}`);
    }
  };

  const handleDownloadPDF = async (proformaId: string) => {
    try {
      const response = await fetch(`/api/pdg/proforma/${proformaId}/pdf`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la génération du PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const proforma = proformas.find((p) => p.id === proformaId);
      a.download = `${proforma?.proformaNumber || `proforma-${proformaId}`}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF téléchargé avec succès");
    } catch (error: any) {
      console.error("Erreur lors du téléchargement du PDF:", error);
      toast.error(error.message || "Erreur lors du téléchargement du PDF");
    }
  };

  const handleViewProforma = (proforma: Proforma) => {
    setSelectedProforma(proforma);
    setShowDetailsModal(true);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: "Brouillon",
      SENT: "Envoyé",
      ACCEPTED: "Accepté",
      EXPIRED: "Expiré",
      CANCELLED: "Annulé",
    };
    return labels[status] || status;
  };

  const getStatusVariant = (
    status: string
  ): "default" | "outline" | "secondary" | "destructive" => {
    if (status === "ACCEPTED") return "default";
    if (status === "CANCELLED" || status === "EXPIRED") return "destructive";
    if (status === "SENT") return "secondary";
    return "outline";
  };

  const filteredProformas = useMemo(() => {
    return proformas.filter((proforma) => {
      const matchesStatus = statusFilter === "all" || proforma.status === statusFilter;
      const recipient = proforma.partner || proforma.user || proforma.clientSnapshot;
      const matchesSearch =
        searchTerm === "" ||
        (proforma.proformaNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (recipient?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (recipient?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        proforma.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [proformas, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredProformas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProformas = filteredProformas.slice(startIndex, startIndex + itemsPerPage);

  // Clients disponibles selon le type
  const availableClients = useMemo(() => {
    if (clientType === "ECOLE") {
      return users.filter((u) => u.role === "ECOLE" || u.role === "CLIENT");
    } else if (clientType === "PARTENAIRE") {
      return partners;
    } else if (clientType === "CLIENT") {
      return users.filter((u) => u.role === "CLIENT");
    }
    return [];
  }, [clientType, users, partners]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des proformas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">PROFORMA</h2>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Header with filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Filter className="w-4 h-4" />
              Filtres
            </Button>

            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 ml-auto">
                  Établir un PROFORMA
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un PROFORMA</DialogTitle>
                </DialogHeader>

                {createStep === 1 ? (
                  <div className="space-y-6">
                    {/* Type de client */}
                    <div>
                      <Label>Type de client *</Label>
                      <Select
                        value={clientType}
                        onValueChange={(value: "ECOLE" | "PARTENAIRE" | "CLIENT" | "INVITE") => {
                          setClientType(value);
                          setClientId("");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ECOLE">École</SelectItem>
                          <SelectItem value="PARTENAIRE">Partenaire</SelectItem>
                          <SelectItem value="CLIENT">Client</SelectItem>
                          <SelectItem value="INVITE">Client invité</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sélection du client */}
                    {clientType !== "INVITE" ? (
                      <div>
                        <Label>
                          {clientType === "ECOLE"
                            ? "Sélectionner l'école"
                            : clientType === "PARTENAIRE"
                            ? "Sélectionner le partenaire"
                            : "Sélectionner le client"}
                          *
                        </Label>
                        <Select value={clientId} onValueChange={setClientId}>
                          <SelectTrigger>
                            <SelectValue placeholder={`Sélectionnez un ${clientType.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableClients.map((client) => (
                              <SelectItem
                                key={client.id}
                                value={client.id}
                              >
                                {client.name} {client.email ? `(${client.email})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label>Nom du client *</Label>
                          <Input
                            value={manualClientName}
                            onChange={(e) => setManualClientName(e.target.value)}
                            placeholder="Nom complet"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={manualClientEmail}
                            onChange={(e) => setManualClientEmail(e.target.value)}
                            placeholder="email@example.com"
                          />
                        </div>
                        <div>
                          <Label>Téléphone</Label>
                          <Input
                            value={manualClientPhone}
                            onChange={(e) => setManualClientPhone(e.target.value)}
                            placeholder="+241 ..."
                          />
                        </div>
                        <div>
                          <Label>Adresse</Label>
                          <Input
                            value={manualClientAddress}
                            onChange={(e) => setManualClientAddress(e.target.value)}
                            placeholder="Adresse complète"
                          />
                        </div>
                      </>
                    )}

                    {/* Pays et devise */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Pays *</Label>
                        <Input value={country} onChange={(e) => setCountry(e.target.value)} />
                      </div>
                      <div>
                        <Label>Devise *</Label>
                        <Select
                          value={currency}
                          onValueChange={(value: "XOF" | "XAF" | "FCFA") => setCurrency(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="XOF">XOF</SelectItem>
                            <SelectItem value="XAF">XAF</SelectItem>
                            <SelectItem value="FCFA">FCFA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Date de validité */}
                    <div>
                      <Label>Valable jusqu'au *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !validUntil && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {validUntil ? format(validUntil, "dd/MM/yyyy", { locale: fr }) : "Sélectionnez une date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={validUntil}
                            onSelect={setValidUntil}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Type de commande */}
                    <div>
                      <Label>Type de commande</Label>
                      <Select value={orderType} onValueChange={setOrderType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Commande pour la rentrée scolaire" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rentree">Commande pour la rentrée scolaire</SelectItem>
                          <SelectItem value="urgente">Commande urgente</SelectItem>
                          <SelectItem value="regulière">Commande régulière</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notes */}
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notes additionnelles..."
                        rows={3}
                      />
                    </div>

                    {/* Boutons étape 1 */}
                    <div className="flex justify-end gap-4">
                      <Button variant="outline" onClick={handleCloseCreateModal}>
                        Annuler
                      </Button>
                      <Button
                        onClick={() => {
                          if (
                            (clientType !== "INVITE" && !clientId) ||
                            (clientType === "INVITE" && !manualClientName) ||
                            !validUntil
                          ) {
                            toast.error("Veuillez remplir tous les champs obligatoires");
                            return;
                          }
                          setCreateStep(2);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Ajout de livre */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        <Label>Choix du livre *</Label>
                        <Popover
                          open={isBookComboboxOpen}
                          onOpenChange={(open) => {
                            setIsBookComboboxOpen(open);
                            if (!open) {
                              setBookSearchTerm("");
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={isBookComboboxOpen}
                              className="w-full justify-between"
                            >
                              {selectedBookId
                                ? works.find((work) => work.id === selectedBookId)?.title ||
                                  "Sélectionnez un livre"
                                : "Sélectionnez un livre..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command shouldFilter={false} className="rounded-lg border-none">
                              <CommandInput
                                placeholder="Rechercher un livre..."
                                value={bookSearchTerm}
                                onValueChange={(value) => setBookSearchTerm(value)}
                                className="h-9"
                              />
                              <CommandList className="max-h-[300px]">
                                <CommandEmpty>
                                  {bookSearchTerm.trim()
                                    ? `Aucun livre trouvé pour "${bookSearchTerm}"`
                                    : "Aucun livre disponible"}
                                </CommandEmpty>
                                <CommandGroup>
                                  {filteredWorksForSelection.map((work) => (
                                    <CommandItem
                                      key={work.id}
                                      value={`${work.title} ${work.isbn || ""}`}
                                      onSelect={() => {
                                        setSelectedBookId(work.id);
                                        setUnitPriceHT(work.price.toString());
                                        setTvaRate((work.tva || 18).toString());
                                        setBookSearchTerm("");
                                        setIsBookComboboxOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedBookId === work.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium">{work.title}</div>
                                        <div className="text-xs text-gray-500">
                                          {(work.price || 0).toLocaleString()} FCFA
                                          {work.isbn && ` • ISBN: ${work.isbn}`}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label>Prix unitaire HT (FCFA)</Label>
                        <Input
                          type="number"
                          value={unitPriceHT}
                          onChange={(e) => setUnitPriceHT(e.target.value)}
                          placeholder="0"
                          min="0"
                          step="100"
                        />
                      </div>

                      <div>
                        <Label>Quantité *</Label>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="0"
                          min="1"
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          onClick={handleAddItem}
                          className="bg-indigo-600 hover:bg-indigo-700 w-full"
                          disabled={!selectedBookId || !quantity}
                        >
                          Ajouter
                        </Button>
                      </div>
                    </div>

                    {/* Remise et TVA par ligne */}
                    {selectedBookId && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Remise (%)</Label>
                          <Input
                            type="number"
                            value={discountRate}
                            onChange={(e) => setDiscountRate(e.target.value)}
                            placeholder="0"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label>TVA (%)</Label>
                          <Input
                            type="number"
                            value={tvaRate}
                            onChange={(e) => setTvaRate(e.target.value)}
                            placeholder="18"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </div>
                      </div>
                    )}

                    {/* Liste des items */}
                    {items.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Livre</TableHead>
                              <TableHead className="text-right">Prix HT</TableHead>
                              <TableHead className="text-right">Qté</TableHead>
                              <TableHead className="text-right">Remise</TableHead>
                              <TableHead className="text-right">TVA</TableHead>
                              <TableHead className="text-right">Total TTC</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item, index) => {
                              const work = works.find((w) => w.id === item.bookId);
                              const unitPrice = item.unitPriceHT || work?.price || 0;
                              const qty = item.quantity || 0;
                              const discount = (item.discountRate || 0) / 100;
                              const tva = (item.tvaRate || work?.tva || 18) / 100;

                              const lineHT = unitPrice * qty;
                              const lineDiscount = lineHT * discount;
                              const lineTaxable = lineHT - lineDiscount;
                              const lineTVA = lineTaxable * tva;
                              const totalTTC = lineTaxable + lineTVA;

                              return (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">
                                    {work?.title || "Livre inconnu"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {unitPrice.toLocaleString("fr-FR")} FCFA
                                  </TableCell>
                                  <TableCell className="text-right">{qty}</TableCell>
                                  <TableCell className="text-right">
                                    {Math.round(discount * 100)}%
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {Math.round(tva * 100)}%
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {totalTTC.toLocaleString("fr-FR")} FCFA
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveItem(index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Totaux */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold mb-3">Résumé</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sous-total HT</span>
                          <span className="font-medium">
                            {totals.subtotalHT.toLocaleString("fr-FR")} {currency}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Remise totale</span>
                          <span className="font-medium text-red-600">
                            - {totals.discountTotal.toLocaleString("fr-FR")} {currency}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base taxable</span>
                          <span className="font-medium">
                            {totals.taxableBase.toLocaleString("fr-FR")} {currency}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">TVA</span>
                          <span className="font-medium">
                            {totals.tvaTotal.toLocaleString("fr-FR")} {currency}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <span className="font-bold text-lg">TOTAL TTC</span>
                        <span className="font-bold text-lg">
                          {totals.totalTTC.toLocaleString("fr-FR")} {currency}
                        </span>
                      </div>
                    </div>

                    {/* Code promo */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Code promo</Label>
                        <Input
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="CODE PROMO"
                        />
                      </div>
                      <div>
                        <Label>Remise globale (%)</Label>
                        <Input
                          type="number"
                          value={promoDiscountRate}
                          onChange={(e) => setPromoDiscountRate(e.target.value)}
                          placeholder="0"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Boutons étape 2 */}
                    <div className="flex justify-end gap-4">
                      <Button variant="outline" onClick={() => setCreateStep(1)}>
                        Retour
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCreateProforma("DRAFT")}
                        disabled={items.length === 0}
                      >
                        Enregistrer en DRAFT
                      </Button>
                      <Button
                        onClick={() => handleCreateProforma("SEND")}
                        className="bg-indigo-600 hover:bg-indigo-700"
                        disabled={items.length === 0}
                      >
                        Enregistrer & Envoyer
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Date Range and Status Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher par numéro, client..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="SENT">Envoyé</SelectItem>
                <SelectItem value="ACCEPTED">Accepté</SelectItem>
                <SelectItem value="EXPIRED">Expiré</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={loadData}>
              Actualiser
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(v) => setItemsPerPage(parseInt(v))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">éléments</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro PROFORMA</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date d'émission</TableHead>
                    <TableHead>Valable jusqu'au</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Total TTC</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProformas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Aucune donnée disponible dans le tableau
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProformas.map((proforma) => {
                      const recipient =
                        proforma.partner || proforma.user || proforma.clientSnapshot;
                      return (
                        <TableRow key={proforma.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium font-mono">
                            {proforma.proformaNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{recipient?.name || "N/A"}</p>
                              <p className="text-sm text-gray-500">{recipient?.email || ""}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(proforma.issuedAt || proforma.createdAt), "dd/MM/yyyy", {
                              locale: fr,
                            })}
                          </TableCell>
                          <TableCell>
                            {proforma.validUntil
                              ? format(new Date(proforma.validUntil), "dd/MM/yyyy", { locale: fr })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(proforma.status)}>
                              {getStatusLabel(proforma.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {(proforma.totalTTC || proforma.total || 0).toLocaleString("fr-FR")}{" "}
                            {proforma.currency || "FCFA"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewProforma(proforma)}
                                title="Voir les détails"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPDF(proforma.id)}
                                title="Télécharger PDF"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredProformas.length)} sur{" "}
                {filteredProformas.length} éléments
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  Premier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Dernier
                </Button>
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="border-t p-4 flex justify-end gap-2">
            <Button variant="outline" className="bg-[#6967CE] text-white">
              PDF
            </Button>
            <Button variant="outline" className="bg-[#6967CE] text-white">
              EXCEL
            </Button>
            <Button variant="outline">
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog Détails Proforma */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails PROFORMA</DialogTitle>
          </DialogHeader>

          {selectedProforma && (
            <div className="space-y-6">
              {/* En-tête avec statut */}
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedProforma.proformaNumber}</h3>
                  <p className="text-sm text-gray-500">PROFORMA</p>
                </div>
                <Badge variant={getStatusVariant(selectedProforma.status)} className="text-sm">
                  {getStatusLabel(selectedProforma.status)}
                </Badge>
              </div>

              {/* Informations client */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Informations client</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-500">Type</Label>
                    <p className="font-medium">
                      {selectedProforma.clientType === "ECOLE"
                        ? "École"
                        : selectedProforma.clientType === "PARTENAIRE"
                        ? "Partenaire"
                        : selectedProforma.clientType === "CLIENT"
                        ? "Client"
                        : "Client invité"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Nom</Label>
                    <p className="font-medium">
                      {(selectedProforma.partner ||
                        selectedProforma.user ||
                        selectedProforma.clientSnapshot)?.name || "N/A"}
                    </p>
                  </div>
                  {(selectedProforma.partner ||
                    selectedProforma.user ||
                    selectedProforma.clientSnapshot)?.email && (
                    <div>
                      <Label className="text-gray-500">Email</Label>
                      <p className="font-medium">
                        {(selectedProforma.partner ||
                          selectedProforma.user ||
                          selectedProforma.clientSnapshot)?.email}
                      </p>
                    </div>
                  )}
                  {(selectedProforma.partner ||
                    selectedProforma.user ||
                    selectedProforma.clientSnapshot)?.phone && (
                    <div>
                      <Label className="text-gray-500">Téléphone</Label>
                      <p className="font-medium">
                        {(selectedProforma.partner ||
                          selectedProforma.user ||
                          selectedProforma.clientSnapshot)?.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations PROFORMA */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Informations PROFORMA</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-500">Pays</Label>
                    <p className="font-medium">{selectedProforma.country || "Gabon"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Devise</Label>
                    <p className="font-medium">{selectedProforma.currency || "FCFA"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Date d'émission</Label>
                    <p className="font-medium">
                      {selectedProforma.issuedAt
                        ? format(new Date(selectedProforma.issuedAt), "dd/MM/yyyy", { locale: fr })
                        : format(new Date(selectedProforma.createdAt), "dd/MM/yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Valable jusqu'au</Label>
                    <p className="font-medium">
                      {selectedProforma.validUntil
                        ? format(new Date(selectedProforma.validUntil), "dd/MM/yyyy", { locale: fr })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Total TTC</Label>
                    <p className="font-bold text-lg">
                      {(selectedProforma.totalTTC || selectedProforma.total || 0).toLocaleString("fr-FR")}{" "}
                      {selectedProforma.currency || "FCFA"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Créé par</Label>
                    <p className="font-medium">{selectedProforma.createdBy?.name || "PDG"}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedProforma.notes && (
                <div className="border rounded-lg p-4">
                  <Label className="text-gray-500">Notes</Label>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                    {selectedProforma.notes}
                  </p>
                </div>
              )}

              {/* Lignes */}
              <div className="border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Lignes</h3>
                    <p className="text-sm text-gray-500">
                      {selectedProforma.items?.length || 0} article(s)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPDF(selectedProforma.id)}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Réf/ISBN</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">PU HT</TableHead>
                      <TableHead className="text-right">Remise</TableHead>
                      <TableHead className="text-right">TVA</TableHead>
                      <TableHead className="text-right">Total TTC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedProforma.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Aucune ligne disponible
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedProforma.items.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-sm">
                            {it.isbn || it.reference || it.workId?.slice?.(0, 8) || "-"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{it.title}</div>
                              {it.authorName && (
                                <div className="text-xs text-gray-500">Par {it.authorName}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{it.quantity}</TableCell>
                          <TableCell className="text-right">
                            {(it.unitPriceHT || 0).toLocaleString("fr-FR")} FCFA
                          </TableCell>
                          <TableCell className="text-right">
                            {Math.round((it.discountRate || 0) * 100)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {Math.round((it.tvaRate || 0.18) * 100)}%
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {(it.totalTTC || 0).toLocaleString("fr-FR")} FCFA
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Totaux (bloc résumé) */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Résumé</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sous-total HT</span>
                    <span className="font-medium">
                      {(selectedProforma.subtotalHT || 0).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remise totale</span>
                    <span className="font-medium text-red-600">
                      - {(selectedProforma.discountTotal || 0).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base taxable</span>
                    <span className="font-medium">
                      {(selectedProforma.taxableBase || 0).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TVA</span>
                    <span className="font-medium">
                      {(selectedProforma.tvaTotal || 0).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <span className="font-bold text-lg">TOTAL TTC</span>
                  <span className="font-bold text-lg">
                    {(selectedProforma.totalTTC || selectedProforma.total || 0).toLocaleString("fr-FR")}{" "}
                    {selectedProforma.currency || "FCFA"}
                  </span>
                </div>
              </div>

              {/* Actions selon statut */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleDownloadPDF(selectedProforma.id)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer / PDF
                </Button>

                {selectedProforma.status === "DRAFT" && (
                  <Button
                    onClick={() => handleProformaAction(selectedProforma.id, "send")}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer
                  </Button>
                )}

                {selectedProforma.status === "SENT" && (
                  <>
                    <Button
                      onClick={() => handleProformaAction(selectedProforma.id, "accept")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marquer accepté
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        const reason = prompt("Raison d'annulation ?");
                        if (reason) handleProformaAction(selectedProforma.id, "cancel", reason);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                  </>
                )}

                {selectedProforma.status === "ACCEPTED" && (
                  <Button
                    onClick={() => handleProformaAction(selectedProforma.id, "convert")}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Convertir en commande
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
