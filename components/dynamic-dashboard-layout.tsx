"use client";

import React, { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { signOut } from "next-auth/react";
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
  Briefcase,
  GraduationCap,
  DollarSign,
  History,
  MessageSquare,
  Building2
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DynamicDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumb?: string;
  showActions?: boolean;
  onRefresh?: () => void;
}

const getNavigationForRole = (role: string, basePath: string) => {
  const commonItems = [
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
          href: `${basePath}/gestion-commandes`,
          icon: ShoppingCart,
          label: "Gestion Commandes"
        },
        {
          href: `${basePath}/gestion-partenaires`,
          icon: Building2,
          label: "Gestion Partenaires"
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
          href: `${basePath}/communication-pilotage`,
          icon: MessageSquare,
          label: "Communication & Pilotage"
        },
        {
          href: `${basePath}/livres`,
          icon: BookOpen,
          label: "Nos livres",
          children: [
            { href: `${basePath}/livres/liste`, label: "Liste" },
            { href: `${basePath}/livres/disciplines`, label: "Disciplines" }
          ]
        },
        {
          href: `${basePath}/utilisateurs`,
          icon: Users,
          label: "Utilisateurs"
        },
        {
          href: `${basePath}/ristournes`,
          icon: Package,
          label: "Ristournes",
          children: [
            { href: `${basePath}/ristournes/partenaires`, label: "Partenaires" },
            { href: `${basePath}/ristournes/auteurs`, label: "Droits d'auteur" }
          ]
        }
      ];

    case "CONCEPTEUR":
      return [
        ...commonItems,
        {
          href: `${basePath}/projets`,
          icon: PenTool,
          label: "Mes projets"
        },
        {
          href: `${basePath}/oeuvres`,
          icon: BookOpen,
          label: "Mes œuvres"
        }
      ];

    case "AUTEUR":
      return [
        ...commonItems,
        {
          href: `${basePath}/oeuvres`,
          icon: BookOpen,
          label: "Mes œuvres"
        },
        {
          href: `${basePath}/royalties`,
          icon: Package,
          label: "Mes royalties"
        }
      ];

    case "REPRESENTANT":
      return [
        ...commonItems,
        {
          href: `${basePath}/partenaires`,
          icon: Briefcase,
          label: "Mes partenaires"
        },
        {
          href: `${basePath}/commandes`,
          icon: ShoppingCart,
          label: "Commandes"
        }
      ];

    case "PARTENAIRE":
      return [
        ...commonItems,
        {
          href: `${basePath}/commandes`,
          icon: ShoppingCart,
          label: "Mes commandes"
        },
        {
          href: `${basePath}/catalogue`,
          icon: BookOpen,
          label: "Catalogue"
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
  onRefresh,
}: DynamicDashboardLayoutProps) {
  const { user, isLoading } = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActivePath = (path: string, exact = false) => {
    if (exact) {
      return pathname === path;
    }
    return pathname === path || pathname.startsWith(path + "/");
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const basePath = `/dashboard/${user.role.toLowerCase()}`;
  const navigation = getNavigationForRole(user.role, basePath);

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
          {navigation.map((item, index) => (
            <div key={index}>
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
                          key={childIndex}
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
                    isActivePath(item.href, item.exact)
                      ? "bg-blue-50 text-blue-600"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          ))}

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

                {/* Notifications - Only for CLIENT role */}
                {user?.role === 'CLIENT' && (
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
