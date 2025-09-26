"use client";

import { useState, useEffect } from "react";
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Settings, 
  Building2, 
  DollarSign, 
  Package, 
  Shield, 
  Bell, 
  FileText,
  Save,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Info,
  Globe,
  Lock,
  Users,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";

interface PlatformSettings {
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  logo: string;
}

interface BusinessSettings {
  defaultTva: number;
  currency: string;
  minOrderAmount: number;
  maxOrderAmount: number;
  orderTimeout: number;
  returnPeriod: number;
}

interface StockSettings {
  defaultMinStock: number;
  defaultMaxStock: number;
  lowStockThreshold: number;
  criticalStockThreshold: number;
  autoReorder: boolean;
}

interface PricingSettings {
  authorRoyaltyRate: number;
  conceptorRoyaltyRate: number;
  partnerCommissionRate: number;
  representantCommissionRate: number;
}

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  lowStockAlerts: boolean;
  orderAlerts: boolean;
  userRegistrationAlerts: boolean;
}

interface SecuritySettings {
  passwordMinLength: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

interface AuditSettings {
  logRetentionDays: number;
  enableDetailedLogging: boolean;
  logUserActions: boolean;
  logSystemEvents: boolean;
}

interface AllSettings {
  platform: PlatformSettings;
  business: BusinessSettings;
  stock: StockSettings;
  pricing: PricingSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  audit: AuditSettings;
}

export default function AdministrationParametresPage() {
  const [settings, setSettings] = useState<AllSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("platform");
  const [hasChanges, setHasChanges] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings");
      const data = await response.json();
      
      if (response.ok) {
        setSettings(data.settings);
      } else {
        toast.error(data.error || "Erreur lors du chargement des paramètres");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Erreur lors du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category: keyof AllSettings, field: string, value: any) => {
    if (!settings) return;

    setSettings(prev => {
      if (!prev) return null;
      
      const newSettings = {
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value
        }
      };
      
      setHasChanges(true);
      return newSettings;
    });
  };

  const saveSettings = async (category?: keyof AllSettings) => {
    if (!settings) return;

    try {
      setSaving(true);
      
      if (category) {
        // Sauvegarder une catégorie spécifique
        const response = await fetch("/api/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            category,
            settings: settings[category]
          })
        });

        const data = await response.json();

        if (response.ok) {
          toast.success(`Paramètres ${category} sauvegardés avec succès`);
          setHasChanges(false);
        } else {
          toast.error(data.error || "Erreur lors de la sauvegarde");
        }
      } else {
        // Sauvegarder tous les paramètres
        for (const [cat, setting] of Object.entries(settings)) {
          const response = await fetch("/api/settings", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              category: cat,
              settings: setting
            })
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Erreur lors de la sauvegarde");
          }
        }
        
        toast.success("Tous les paramètres sauvegardés avec succès");
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erreur lors de la sauvegarde des paramètres");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "reset_to_defaults"
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSettings(data.settings);
        setHasChanges(false);
        setIsResetDialogOpen(false);
        toast.success("Paramètres réinitialisés aux valeurs par défaut");
      } else {
        toast.error(data.error || "Erreur lors de la réinitialisation");
      }
    } catch (error) {
      console.error("Error resetting settings:", error);
      toast.error("Erreur lors de la réinitialisation des paramètres");
    }
  };

  const exportSettings = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "export_settings"
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Créer et télécharger le fichier
        const blob = new Blob([JSON.stringify(data.settings, null, 2)], {
          type: "application/json"
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `paramètres-lahamarchand-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success("Paramètres exportés avec succès");
      } else {
        toast.error(data.error || "Erreur lors de l'export");
      }
    } catch (error) {
      console.error("Error exporting settings:", error);
      toast.error("Erreur lors de l'export des paramètres");
    }
  };

  const validateSettings = async () => {
    if (!settings) return;

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "validate_settings",
          settings
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.valid) {
          toast.success("Paramètres valides");
        } else {
          toast.error(`Paramètres invalides: ${data.errors.join(", ")}`);
        }
      } else {
        toast.error(data.error || "Erreur lors de la validation");
      }
    } catch (error) {
      console.error("Error validating settings:", error);
      toast.error("Erreur lors de la validation des paramètres");
    }
  };

  if (loading) {
    return (
      <DynamicDashboardLayout title="Administration & Paramètres">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DynamicDashboardLayout>
    );
  }

  if (!settings) {
    return (
      <DynamicDashboardLayout title="Administration & Paramètres">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Erreur lors du chargement des paramètres</p>
        </div>
      </DynamicDashboardLayout>
    );
  }

  return (
    <DynamicDashboardLayout title="Administration & Paramètres" showActions>
      <div className="space-y-6">
        {/* Actions globales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Actions globales</span>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={validateSettings} 
                  variant="outline" 
                  size="sm"
                  disabled={saving}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider
                </Button>
                <Button 
                  onClick={() => saveSettings()} 
                  variant="default" 
                  size="sm"
                  disabled={saving || !hasChanges}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Sauvegarde..." : "Sauvegarder tout"}
                </Button>
                <Button 
                  onClick={exportSettings} 
                  variant="outline" 
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
                <Button 
                  onClick={() => setIsResetDialogOpen(true)} 
                  variant="outline" 
                  size="sm"
                  disabled={saving}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="platform" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Plateforme</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Métier</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Stock</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Tarification</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Sécurité</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Audit</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="platform" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Paramètres de la plateforme</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform-name">Nom de la plateforme</Label>
                    <Input
                      id="platform-name"
                      value={settings.platform.name}
                      onChange={(e) => updateSetting("platform", "name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform-email">Email de contact</Label>
                    <Input
                      id="platform-email"
                      type="email"
                      value={settings.platform.email}
                      onChange={(e) => updateSetting("platform", "email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform-phone">Téléphone</Label>
                    <Input
                      id="platform-phone"
                      value={settings.platform.phone}
                      onChange={(e) => updateSetting("platform", "phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform-website">Site web</Label>
                    <Input
                      id="platform-website"
                      value={settings.platform.website}
                      onChange={(e) => updateSetting("platform", "website", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-description">Description</Label>
                  <Textarea
                    id="platform-description"
                    value={settings.platform.description}
                    onChange={(e) => updateSetting("platform", "description", e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-address">Adresse</Label>
                  <Textarea
                    id="platform-address"
                    value={settings.platform.address}
                    onChange={(e) => updateSetting("platform", "address", e.target.value)}
                    rows={2}
                  />
                </div>
                <Button onClick={() => saveSettings("platform")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder les paramètres plateforme
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Paramètres métier</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-tva">TVA par défaut (%)</Label>
                    <Input
                      id="business-tva"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={settings.business.defaultTva}
                      onChange={(e) => updateSetting("business", "defaultTva", parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-currency">Devise</Label>
                    <Select
                      value={settings.business.currency}
                      onValueChange={(value) => updateSetting("business", "currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="XOF">XOF (F CFA)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-min-order">Montant minimum commande (€)</Label>
                    <Input
                      id="business-min-order"
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.business.minOrderAmount}
                      onChange={(e) => updateSetting("business", "minOrderAmount", parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-max-order">Montant maximum commande (€)</Label>
                    <Input
                      id="business-max-order"
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.business.maxOrderAmount}
                      onChange={(e) => updateSetting("business", "maxOrderAmount", parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-timeout">Délai d'expiration commande (jours)</Label>
                    <Input
                      id="business-timeout"
                      type="number"
                      min="1"
                      value={settings.business.orderTimeout}
                      onChange={(e) => updateSetting("business", "orderTimeout", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-return">Délai de retour (jours)</Label>
                    <Input
                      id="business-return"
                      type="number"
                      min="0"
                      value={settings.business.returnPeriod}
                      onChange={(e) => updateSetting("business", "returnPeriod", parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <Button onClick={() => saveSettings("business")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder les paramètres métier
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Paramètres de stock</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock-min">Stock minimum par défaut</Label>
                    <Input
                      id="stock-min"
                      type="number"
                      min="0"
                      value={settings.stock.defaultMinStock}
                      onChange={(e) => updateSetting("stock", "defaultMinStock", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock-max">Stock maximum par défaut</Label>
                    <Input
                      id="stock-max"
                      type="number"
                      min="0"
                      value={settings.stock.defaultMaxStock}
                      onChange={(e) => updateSetting("stock", "defaultMaxStock", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock-low-threshold">Seuil d'alerte stock faible</Label>
                    <Input
                      id="stock-low-threshold"
                      type="number"
                      min="0"
                      value={settings.stock.lowStockThreshold}
                      onChange={(e) => updateSetting("stock", "lowStockThreshold", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock-critical-threshold">Seuil critique</Label>
                    <Input
                      id="stock-critical-threshold"
                      type="number"
                      min="0"
                      value={settings.stock.criticalStockThreshold}
                      onChange={(e) => updateSetting("stock", "criticalStockThreshold", parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="stock-auto-reorder"
                    checked={settings.stock.autoReorder}
                    onCheckedChange={(checked) => updateSetting("stock", "autoReorder", checked)}
                  />
                  <Label htmlFor="stock-auto-reorder">Réapprovisionnement automatique</Label>
                </div>
                <Button onClick={() => saveSettings("stock")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder les paramètres de stock
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Politiques de tarification</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricing-author">Taux royalties auteurs (%)</Label>
                    <Input
                      id="pricing-author"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={settings.pricing.authorRoyaltyRate}
                      onChange={(e) => updateSetting("pricing", "authorRoyaltyRate", parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricing-concepteur">Taux royalties concepteurs (%)</Label>
                    <Input
                      id="pricing-concepteur"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={settings.pricing.conceptorRoyaltyRate}
                      onChange={(e) => updateSetting("pricing", "conceptorRoyaltyRate", parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricing-partner">Commission partenaires (%)</Label>
                    <Input
                      id="pricing-partner"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={settings.pricing.partnerCommissionRate}
                      onChange={(e) => updateSetting("pricing", "partnerCommissionRate", parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricing-representant">Commission représentants (%)</Label>
                    <Input
                      id="pricing-representant"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={settings.pricing.representantCommissionRate}
                      onChange={(e) => updateSetting("pricing", "representantCommissionRate", parseFloat(e.target.value))}
                    />
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Total des commissions: {((settings.pricing.authorRoyaltyRate + settings.pricing.conceptorRoyaltyRate + settings.pricing.partnerCommissionRate + settings.pricing.representantCommissionRate) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Button onClick={() => saveSettings("pricing")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder les politiques de tarification
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Paramètres de notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notif-email">Notifications par email</Label>
                      <p className="text-sm text-gray-500">Activer les notifications par email</p>
                    </div>
                    <Switch
                      id="notif-email"
                      checked={settings.notifications.emailEnabled}
                      onCheckedChange={(checked) => updateSetting("notifications", "emailEnabled", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notif-sms">Notifications par SMS</Label>
                      <p className="text-sm text-gray-500">Activer les notifications par SMS</p>
                    </div>
                    <Switch
                      id="notif-sms"
                      checked={settings.notifications.smsEnabled}
                      onCheckedChange={(checked) => updateSetting("notifications", "smsEnabled", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notif-stock">Alertes stock faible</Label>
                      <p className="text-sm text-gray-500">Notifier quand le stock est faible</p>
                    </div>
                    <Switch
                      id="notif-stock"
                      checked={settings.notifications.lowStockAlerts}
                      onCheckedChange={(checked) => updateSetting("notifications", "lowStockAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notif-orders">Alertes commandes</Label>
                      <p className="text-sm text-gray-500">Notifier les nouveaux statuts de commandes</p>
                    </div>
                    <Switch
                      id="notif-orders"
                      checked={settings.notifications.orderAlerts}
                      onCheckedChange={(checked) => updateSetting("notifications", "orderAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notif-registration">Alertes inscriptions</Label>
                      <p className="text-sm text-gray-500">Notifier les nouvelles inscriptions</p>
                    </div>
                    <Switch
                      id="notif-registration"
                      checked={settings.notifications.userRegistrationAlerts}
                      onCheckedChange={(checked) => updateSetting("notifications", "userRegistrationAlerts", checked)}
                    />
                  </div>
                </div>
                <Button onClick={() => saveSettings("notifications")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder les paramètres de notifications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Paramètres de sécurité</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="security-password-length">Longueur minimale mot de passe</Label>
                    <Input
                      id="security-password-length"
                      type="number"
                      min="6"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => updateSetting("security", "passwordMinLength", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="security-session-timeout">Timeout session (minutes)</Label>
                    <Input
                      id="security-session-timeout"
                      type="number"
                      min="30"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting("security", "sessionTimeout", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="security-max-attempts">Tentatives de connexion max</Label>
                    <Input
                      id="security-max-attempts"
                      type="number"
                      min="3"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => updateSetting("security", "maxLoginAttempts", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="security-lockout-duration">Durée de blocage (minutes)</Label>
                    <Input
                      id="security-lockout-duration"
                      type="number"
                      min="5"
                      value={settings.security.lockoutDuration}
                      onChange={(e) => updateSetting("security", "lockoutDuration", parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <Button onClick={() => saveSettings("security")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder les paramètres de sécurité
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Paramètres d'audit</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="audit-retention">Rétention des logs (jours)</Label>
                    <Input
                      id="audit-retention"
                      type="number"
                      min="30"
                      value={settings.audit.logRetentionDays}
                      onChange={(e) => updateSetting("audit", "logRetentionDays", parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="audit-detailed">Logging détaillé</Label>
                      <p className="text-sm text-gray-500">Enregistrer des informations détaillées</p>
                    </div>
                    <Switch
                      id="audit-detailed"
                      checked={settings.audit.enableDetailedLogging}
                      onCheckedChange={(checked) => updateSetting("audit", "enableDetailedLogging", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="audit-user-actions">Logs actions utilisateurs</Label>
                      <p className="text-sm text-gray-500">Enregistrer les actions des utilisateurs</p>
                    </div>
                    <Switch
                      id="audit-user-actions"
                      checked={settings.audit.logUserActions}
                      onCheckedChange={(checked) => updateSetting("audit", "logUserActions", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="audit-system-events">Logs événements système</Label>
                      <p className="text-sm text-gray-500">Enregistrer les événements système</p>
                    </div>
                    <Switch
                      id="audit-system-events"
                      checked={settings.audit.logSystemEvents}
                      onCheckedChange={(checked) => updateSetting("audit", "logSystemEvents", checked)}
                    />
                  </div>
                </div>
                <Button onClick={() => saveSettings("audit")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder les paramètres d'audit
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de réinitialisation */}
        <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Réinitialiser les paramètres</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ?
                Cette action est irréversible et supprimera toutes vos modifications non sauvegardées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={resetToDefaults}>
                Réinitialiser
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DynamicDashboardLayout>
  );
}



