"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Home,
  ShoppingCart,
  FileText,
  Package,
  Users,
  Camera,
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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumb?: string;
  showActions?: boolean;
  onRefresh?: () => void;
}

export default function DashboardLayout({
  children,
  title,
  breadcrumb,
  showActions = false,
  onRefresh,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const pathname = usePathname();

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false); // Reset mobile state on desktop
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const isActivePath = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

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
              <div className="flex-shrink-0 ">
                <img
                  src="/images/laha-logo.png"
                  alt="LAHA Marchand"
                  className="w-12 h-12 object-contain p-1"
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
          <Link
            href="/dashboard/client"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
              isActivePath("/dashboard/pdg") && pathname === "/dashboard/client"
                ? "bg-blue-50 text-blue-600"
                : "hover:bg-gray-100"
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Tableau de bord</span>
          </Link>

          <Link
            href="/dashboard/client/commandes"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
              isActivePath("/dashboard/pdg/commandes")
                ? "bg-blue-50 text-blue-600"
                : "hover:bg-gray-100"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Mes commandes</span>
          </Link>

          <Link
            href="/dashboard/client/effectif"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
              isActivePath("/dashboard/client/effectif")
                ? "bg-blue-50 text-blue-600"
                : "hover:bg-gray-100"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Effectif</span>
          </Link>

          <Link
            href="/dashboard/client/livres"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
              isActivePath("/dashboard/client/livres")
                ? "bg-blue-50 text-blue-600"
                : "hover:bg-gray-100"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Nos Livres</span>
          </Link>

                    <Link
            href="/dashboard/client/stock"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
              isActivePath("/dashboard/client/stock")
                ? "bg-blue-50 text-blue-600"
                : "hover:bg-gray-100"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Niveau stock</span>
          </Link>

          <Link
            href="/dashboard/client/rapport-stock"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
              isActivePath("/dashboard/client/rapport-stock")
                ? "bg-blue-50 text-blue-600"
                : "hover:bg-gray-100"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Rapports Stock</span>
          </Link>

          <Link
            href="/dashboard/client/ventes-retours"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
              isActivePath("/dashboard/client/ventes-retours")
                ? "bg-blue-50 text-blue-600"
                : "hover:bg-gray-100"
            }`}
          >
            <Camera className="w-5 h-5" />
            <span>Ventes & retours</span>
          </Link>

          <Link
            href="/dashboard/client/profil"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <User className="w-5 h-5" />
            <span>Mon profil</span>
          </Link>

          <Link
            href="/auth/login"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </Link>
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
                      onClick={handleRefresh}
                      className="p-2 hover:bg-slate-600 rounded-lg"
                      title="Actualiser"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleFullscreen}
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

                {/* French Flag */}
                <div className="w-8 h-5 flex overflow-hidden rounded-sm border border-gray-300">
                  <div className="flex-1 bg-[#0055A4]"></div> {/* Bleu */}
                  <div className="flex-1 bg-white"></div> {/* Blanc */}
                  <div className="flex-1 bg-[#EF4135]"></div> {/* Rouge */}
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 hover:bg-slate-600 rounded-lg"
                  >
                    <Bell className="w-5 h-5" />
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border z-50 text-gray-900">
                      <div className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-semibold">NOTIFICATIONS</h3>
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          Tout lire
                        </button>
                      </div>
                      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="text-sm font-medium text-blue-600">
                              Bon de sortie : LA-20250725-73727
                            </p>
                            <p className="text-xs text-gray-500">
                              La quantité totale ( 5 ) de livre demandés est
                              insuffisante.
                            </p>
                            <p className="text-xs text-gray-500">
                              Rechargez le stock pour permettre la validation du
                              bon de sortie.
                            </p>
                            <p className="text-xs text-gray-400">
                              ven. 25 juil. 2025 16:28
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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
                        <p className="font-semibold">Super</p>
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Client
                        </span>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/dashboard/pdg/profil"
                          className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded"
                        >
                          <User className="w-4 h-4" />
                          <span>Mon profil</span>
                        </Link>
                        <Link
                          href="/auth/login"
                          className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Déconnexion</span>
                        </Link>
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
