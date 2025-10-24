"use client";

import React, { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import {
  Home,
  ShoppingCart,
  FileText,
  Package,
  Users,
  BookOpen,
  User,
  LogOut,
  Bell,
  ChevronDown,
  ChevronRight,
  X,
  Menu,
  RefreshCw,
  Maximize2,
  Minimize2,
  Settings,
  PenTool,
  UserCheck,
  Plus,
  Briefcase,
  GraduationCap,
  DollarSign,
  History,
  MessageSquare,
  Building2,
  Camera,
  TrendingUp,
  ArrowRightLeft
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationChild = { href: string; label: string };
type NavigationItem = {
  href: string;
  icon: any;
  label: string;
  exact?: boolean;
  children?: NavigationChild[];
};

interface DynamicDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumb?: string;
  showActions?: boolean;
  onRefresh?: () => void;
}

const getNavigationForRole = (role: string, basePath: string): NavigationItem[] => {
  const commonItems: NavigationItem[] = [
    {
      href: basePath,
      icon: Home,
      label: "Tableau de bord",
      exact: true
    }
  ];

  switch (role) {
    case "PDG":
      return [
        ...commonItems,
        {
          href: `${basePath}/validation-inscriptions`,
          icon: Users,
          label: "Validation Inscriptions"
        },
        {
          href: `${basePath}/gestion-utilisateurs`,
          icon: Users,
          label: "Gestion Utilisateurs"
        },
        {
          href: `${basePath}/gestion-disciplines`,
          icon: GraduationCap,
          label: "Gestion Disciplines"
        },
        {
          href: `${basePath}/validation-oeuvres`,
          icon: BookOpen,
          label: "Validation Œuvres"
        },
        {
          href: `${basePath}/gestion-projets`,
          icon: FileText,
          label: "Gestion des Projets"
        },
        {
          href: `${basePath}/gestion-commandes`,
          icon: ShoppingCart,
          label: "Gestion Commandes"
        },
        {
          href: `${basePath}/gestion-stock`,
          icon: Package,
          label: "Gestion Stock"
        },
        {
          href: `${basePath}/gestion-stock/operations`,
          icon: ArrowRightLeft,
          label: "Opérations de stock"
        },
        {
          href: `${basePath}/commandes`,
          icon: ShoppingCart,
          label: "Les commandes"
        },
        {
          href: `${basePath}/bon-sortie`,
          icon: FileText,
          label: "Bon de sortie"
        },
        {
          href: `${basePath}/proforma`,
          icon: FileText,
          label: "Proforma"
        },
        {
          href: `${basePath}/livres`,
          icon: BookOpen,
          label: "Nos livres",
          children: [
            { href: `${basePath}/livres/liste`, label: "Livres" },
            { href: `${basePath}/livres/collections`, label: "Collections" },
            { href: `${basePath}/livres/categories`, label: "Catégories" },
            { href: `${basePath}/livres/classes`, label: "Classes" },
            { href: `${basePath}/livres/matieres`, label: "Matières" },
            { href: `${basePath}/livres/code-promo`, label: "Code Promo" }
          ]
        },
        {
          href: `${basePath}/ristournes`,
          icon: Package,
          label: "Ristournes",
          children: [
            { href: `${basePath}/ristournes/partenaire`, label: "Partenaire" },
            { href: `${basePath}/ristournes/droit-auteur`, label: "Droits d'auteur" }
          ]
        },
        {
          href: `${basePath}/gestion-partenaires`,
          icon: Building2,
          label: "Gestion Partenaires"
        },
        {
          href: `${basePath}/gestion-ecoles`,
          icon: GraduationCap,
          label: "Gestion Écoles"
        },
        {
          href: `${basePath}/utilisateurs`,
          icon: Users,
          label: "Utilisateurs"
        },
        {
          href: `${basePath}/clients`,
          icon: Users,
          label: "Clients"
        },
        {
          href: `${basePath}/ventes-retours`,
          icon: Camera,
          label: "Ventes & retours"
        },
        {
          href: `${basePath}/gestion-financiere`,
          icon: DollarSign,
          label: "Gestion Financière"
        },
        {
          href: `${basePath}/notifications`,
          icon: Bell,
          label: "Notifications",
          children: [
            { href: `${basePath}/notifications/liste`, label: "Liste" },
            { href: `${basePath}/notifications/diffusion`, label: "Diffusion" },
            { href: `${basePath}/notifications/chaine`, label: "Chaîne" }
          ]
        },
        {
          href: `${basePath}/audit-historique`,
          icon: History,
          label: "Audit & Historique"
        },
        {
          href: `${basePath}/parametres`,
          icon: Settings,
          label: "Paramètres",
          children: [
            { href: `${basePath}/parametres/departements`, label: "Départements" },
            { href: `${basePath}/parametres/zones`, label: "Zones" },
            { href: `${basePath}/parametres/effectifs`, label: "Effectifs" },
            { href: `${basePath}/parametres/reductions`, label: "Réductions" },
            { href: `${basePath}/parametres/logs`, label: "Logs" },
            { href: `${basePath}/parametres/avance`, label: "Avancé" }
          ]
        },
        {
          href: `${basePath}/administration-parametres`,
          icon: Settings,
          label: "Administration & Paramètres"
        }
      ];

    case "AUTEUR":
      return [
        ...commonItems,
        {
          href: `${basePath}/creer-oeuvre`,
          icon: Plus,
          label: "Créer une œuvre"
        },
        {
          href: `${basePath}/mes-oeuvres`,
          icon: BookOpen,
          label: "Mes œuvres"
        },
        {
          href: `${basePath}/mes-droits`,
          icon: DollarSign,
          label: "Mes droits"
        },
        {
          href: `${basePath}/historique`,
          icon: History,
          label: "Historique"
        },
        {
          href: `${basePath}/notifications`,
          icon: Bell,
          label: "Notifications"
        }
      ];

    case "CONCEPTEUR":
      return [
        ...commonItems,
        {
          href: `${basePath}/nouveau-projet`,
          icon: Plus,
          label: "Nouveau projet"
        },
        {
          href: `${basePath}/mes-projets`,
          icon: PenTool,
          label: "Mes projets"
        },
        {
          href: `${basePath}/nouvelle-oeuvre`,
          icon: Plus,
          label: "Nouvelle œuvre"
        },
        {
          href: `${basePath}/mes-oeuvres`,
          icon: BookOpen,
          label: "Mes œuvres"
        },
        {
          href: `${basePath}/partenaires`,
          icon: Users,
          label: "Mes partenaires"
        },
        {
          href: `${basePath}/commandes`,
          icon: ShoppingCart,
          label: "Commandes partenaires"
        },
        {
          href: `${basePath}/notifications`,
          icon: Bell,
          label: "Notifications"
        },
        {
          href: `${basePath}/messages`,
          icon: MessageSquare,
          label: "Messages"
        }
      ];

    case "REPRESENTANT":
      return [
        ...commonItems,
        {
          href: `${basePath}/partenaires`,
          icon: Building2,
          label: "Mes Partenaires"
        },
        {
          href: `${basePath}/commandes`,
          icon: ShoppingCart,
          label: "Commandes Partenaires"
        },
        {
          href: `${basePath}/rapports`,
          icon: FileText,
          label: "Rapports"
        },
        {
          href: `${basePath}/messagerie`,
          icon: MessageSquare,
          label: "Messagerie"
        },
        {
          href: `${basePath}/notifications`,
          icon: Bell,
          label: "Notifications"
        }
      ];

    case "PARTENAIRE":
      return [
        ...commonItems,
        {
          href: `${basePath}/stock/niveau`,
          icon: Package,
          label: "Stock alloué"
        },
        {
          href: `${basePath}/commandes`,
          icon: ShoppingCart,
          label: "Mes commandes"
        },
        {
          href: `${basePath}/catalogue`,
          icon: BookOpen,
          label: "Catalogue"
        },
        {
          href: `${basePath}/ventes-retours`,
          icon: TrendingUp,
          label: "Ventes réalisées"
        },
        {
          href: `${basePath}/rapports`,
          icon: FileText,
          label: "Rapports"
        },
        {
          href: `${basePath}/notifications/liste`,
          icon: Bell,
          label: "Notifications"
        }
      ];

    case "CLIENT":
      return [
        ...commonItems,
        {
          href: `${basePath}/catalogue`,
          icon: BookOpen,
          label: "Catalogue"
        },
        {
          href: `${basePath}/commandes`,
          icon: ShoppingCart,
          label: "Mes commandes"
        },
        {
          href: `${basePath}/notifications`,
          icon: Bell,
          label: "Notifications"
        }
      ];

    default:
      return commonItems;
  }
};

export default function DynamicDashboardLayout({
  children,
  title,
  breadcrumb,
  showActions = false,
  onRefresh
}: DynamicDashboardLayoutProps) {
  const { user } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Calculer les variables avant les returns conditionnels
  const basePath = user ? `/dashboard/${user.role.toLowerCase()}` : '';
  const navigation = user ? getNavigationForRole(user.role, basePath) : [];

  // Restreindre l'accès aux routes non prévues pour le rôle
  useEffect(() => {
    if (!user || !basePath) return; // Vérifications de sécurité

    const allowed: string[] = [];
    navigation.forEach((item) => {
      allowed.push(item.href);
      if (item.children) {
        item.children.forEach((child) => allowed.push(child.href));
      }
    });
    allowed.push(`${basePath}/profil`);

    const isAllowed = allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!isAllowed) {
      router.replace(basePath);
    }
  }, [pathname, basePath, navigation, router, user]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      router.push("/auth/signin");
    } catch (error) {
      console.error("Error signing out:", error);
      router.push("/auth/signin");
    }
  };

  const toggleSection = (sectionLabel: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionLabel]: !prev[sectionLabel]
    }));
  };

  const isActivePath = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - UNIQUE */}
      {!isFullscreen && (
        <aside
          id="unique-sidebar"
          className={`
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            fixed lg:relative left-0 top-0 h-full w-64 bg-white shadow-lg flex flex-col z-50 lg:z-auto
            transition-transform duration-300 ease-in-out
          `}
        >
          {/* Logo section */}
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex justify-center items-center">
                  <img
                    src="/images/laha-logo.png"
                    alt="LAHA Marchand"
                    className="w-20 h-20 object-contain p-1"
                  />
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation - UNIQUE */}
          <nav id="unique-navigation" className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item, index) => {
              const isActive = isActivePath(item.href, item.exact);
              return (
                <div key={`nav-item-${index}-${item.href}`}>
                  {item.children ? (
                    <div className="space-y-1">
                      <button
                        onClick={() => toggleSection(item.label)}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </div>
                        {expandedSections[item.label] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      {expandedSections[item.label] && (
                        <div className="ml-8 space-y-1">
                          {item.children.map((child, childIndex) => (
                            <Link
                              key={`nav-child-${childIndex}-${child.href}`}
                              href={child.href}
                              className={`block px-3 py-1 text-sm rounded ${
                                isActivePath(child.href)
                                  ? "bg-blue-50 text-blue-600"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}

            {/* User section */}
            <div className="pt-4 border-t">
              <Link
                href={`${basePath}/profil`}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <User className="w-5 h-5" />
                <span>Mon profil</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 w-full text-left"
              >
                <LogOut className="w-5 h-5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </nav>
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        {!isFullscreen && (
          <header className="bg-slate-700 text-white shadow-sm px-4 lg:px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-slate-600 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div>
                  <h1 className="text-xl font-semibold">{title}</h1>
                  {breadcrumb && (
                    <p className="text-sm text-slate-300">{breadcrumb}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {showActions && (
                  <div className="hidden md:flex items-center space-x-2">
                    <button
                      onClick={onRefresh}
                      className="p-2 hover:bg-slate-600 rounded-lg"
                      title="Actualiser"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="p-2 hover:bg-slate-600 rounded-lg"
                      title="Plein écran"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-5 h-5" />
                      ) : (
                        <Maximize2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}

                {/* Notifications */}
                {['CLIENT', 'AUTEUR', 'CONCEPTEUR', 'PDG'].includes(user?.role as string) && (
                  <NotificationBell />
                )}

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 hover:bg-slate-600 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <Link
                        href={`${basePath}/profil`}
                        className="block px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Mon profil
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Main content area */}
        <main className="flex-1 bg-gray-50 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
