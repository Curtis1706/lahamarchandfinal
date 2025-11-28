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
  Camera
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
          href: `${basePath}/gestion-financiere`,
          icon: DollarSign,
          label: "Gestion Financière"
        },
        {
          href: `${basePath}/audit-historique`,
          icon: History,
          label: "Audit & Historique"
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
          href: `${basePath}/mes-projets`,
          icon: PenTool,
          label: "Mes projets"
        },
        {
          href: `${basePath}/mes-oeuvres`,
          icon: BookOpen,
          label: "Mes œuvres"
        },
        {
          href: `${basePath}/notifications`,
          icon: Bell,
          label: "Notifications"
        }
      ];

    case "REPRESENTANT":
      return [
        ...commonItems,
        {
          href: `${basePath}/mes-clients`,
          icon: Users,
          label: "Mes clients"
        },
        {
          href: `${basePath}/mes-commandes`,
          icon: ShoppingCart,
          label: "Mes commandes"
        },
        {
          href: `${basePath}/mes-partenaires`,
          icon: Building2,
          label: "Mes partenaires"
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
          href: `${basePath}/mes-commandes`,
          icon: ShoppingCart,
          label: "Mes commandes"
        },
        {
          href: `${basePath}/mes-stocks`,
          icon: Package,
          label: "Mes stocks"
        },
        {
          href: `${basePath}/mes-clients`,
          icon: Users,
          label: "Mes clients"
        },
        {
          href: `${basePath}/notifications`,
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
      await signOut({ 
        callbackUrl: "/auth/login",
        redirect: true 
      });
    } catch (error) {
      console.error("Error signing out:", error);
      router.push("/auth/login");
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
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
        ${isFullscreen ? "hidden" : "block"}
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        fixed lg:static left-0 top-0 h-full w-64 bg-white shadow-lg flex flex-col z-50 lg:z-auto
        transition-transform duration-300 ease-in-out
      `}
      >
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

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
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

                {/* Notifications - for CLIENT, AUTEUR, CONCEPTEUR, PDG */}
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
                    <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border z-50 text-gray-900">
                      <div className="p-4 border-b text-center">
                        <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-2"></div>
                        <p className="font-semibold">{user.name}</p>
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {user.role}
                        </span>
                      </div>
                      <div className="p-2">
                        <Link
                          href={`${basePath}/profil`}
                          className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded"
                        >
                          <User className="w-4 h-4" />
                          <span>Mon profil</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 bg-gray-50 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}