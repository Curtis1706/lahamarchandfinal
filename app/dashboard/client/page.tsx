"use client";

import { useState, useEffect } from "react";
import { User, BookOpen, ShoppingCart, Bell, TrendingUp, TrendingDown } from "lucide-react";
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNotifications } from "@/hooks/use-notifications";
import { useOrders } from "@/hooks/use-orders";
import { useCart } from "@/hooks/use-cart";
import { apiClient } from "@/lib/api-client";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

const books = [
  {
    title: "COFFRET RÉUSSIR EN MATHÉMATIQUES CE1",
    subject: "MATHÉMATIQUES, CE1",
    price: "1700 F CFA",
    image: "/01.png",
  },
  {
    title: "RÉUSSIR EN DICTÉE ORTHOGRAPHE CE1-CE2",
    subject: "FRANÇAIS, CE1, CE2",
    price: "900 F CFA",
    image: "/02.png",
  },
  {
    title: "RÉUSSIR EN MATHÉMATIQUES - MANUEL DE CM2",
    subject: "MATHÉMATIQUES, CM2",
    price: "900 F CFA",
    image: "/10001.png",
  },
];

const COLORS = ["#00C853", "#2962FF", "#FF4081"];

// Types pour les données
interface Work {
  id: string
  title: string
  isbn: string
  price: number
  tva: number
  stock: number
  disciplineId: string
  status: string
}

interface Discipline {
  id: string
  name: string
}

interface WorkWithDiscipline extends Work {
  discipline?: Discipline
  image?: string
}

const dataQuantites = [
  { name: "Commandes validées", value: 2 },
  { name: "Livraisons en cours", value: 1 },
  { name: "Livrées/Réceptionnées", value: 1 },
];

const dataMontants = [
  { name: "Commandes validées", value: 30000 },
  { name: "Livraisons en cours", value: 15000 },
  { name: "Livrées/Réceptionnées", value: 15000 },
];

export default function ClientDashboard() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const { notifications, unreadCount } = useNotifications();
  const { orders } = useOrders();
  const { cart, addToCart, isInCart } = useCart();
  const [works, setWorks] = useState<WorkWithDiscipline[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBookIndex, setCurrentBookIndex] = useState(0);

  // Charger les données réelles
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [worksData, disciplinesData] = await Promise.all([
          apiClient.getWorks(),
          apiClient.getDisciplines()
        ]);

        // L'API retourne un objet avec works, pagination, stats
        // ou directement un tableau selon le contexte
        const worksArray: any[] = Array.isArray(worksData) ? worksData : ((worksData as any).works || [])

        // Filtrer uniquement les livres PUBLISHED (sécurité supplémentaire)
        const publishedWorks = worksArray.filter((work: any) => work.status === 'PUBLISHED')

        // Enrichir les works avec les disciplines et images
        const enrichedWorks = publishedWorks.map((work: any) => ({
          ...work,
          discipline: disciplinesData.find(d => d.id === work.disciplineId),
          image: getBookImageUrl(work)
        }));

        setWorks(enrichedWorks);
        setDisciplines(disciplinesData);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fonction pour obtenir l'URL de l'image d'un livre
  const getBookImageUrl = (work: any): string => {
    // D'abord, essayer d'obtenir l'image depuis le champ files
    if (work.files) {
      try {
        const filesData = typeof work.files === 'string' ? JSON.parse(work.files) : work.files;
        if (filesData.coverImage) {
          return filesData.coverImage;
        }
      } catch (e) {
        console.error("Error parsing files:", e);
      }
    }

    // Fallback: utiliser des images par défaut basées sur la discipline ou le titre
    const title = work.title || '';
    const discipline = work.discipline?.name || '';

    const availableImages = [
      '/01.png', '/02.png', '/10001.png', '/10002.png',
      '/10011.png', '/10012.png', '/10013.png'
    ];

    const disciplineImages: { [key: string]: string[] } = {
      'Mathématiques': ['/10001.png'],
      'Français': ['/01.png', '/02.png'],
      'Sciences': ['/10002.png', '/10011.png', '/10012.png', '/10013.png'],
      'Histoire': ['/communication-book.jpg'],
      'Géographie': ['/communication-book.jpg'],
      'Anglais': ['/french-textbook-coffret-ce2.jpg']
    };

    if (discipline) {
      const disciplineImageList = disciplineImages[discipline];
      if (disciplineImageList && disciplineImageList.length > 0) {
        const randomIndex = Math.floor(Math.random() * disciplineImageList.length);
        return disciplineImageList[randomIndex];
      }
    }

    if (title.toLowerCase().includes('math') || title.toLowerCase().includes('mathématiques')) {
      return '/10001.png';
    }
    if (title.toLowerCase().includes('français') || title.toLowerCase().includes('french') || title.toLowerCase().includes('dictée')) {
      return Math.random() > 0.5 ? '/01.png' : '/02.png';
    }
    if (title.toLowerCase().includes('svt') || title.toLowerCase().includes('sciences')) {
      const svtImages = ['/10002.png', '/10011.png', '/10012.png', '/10013.png'];
      const randomIndex = Math.floor(Math.random() * svtImages.length);
      return svtImages[randomIndex];
    }

    const randomIndex = Math.floor(Math.random() * availableImages.length);
    return availableImages[randomIndex];
  };

  // Calculer les statistiques réelles
  const totalOrders = orders.length;
  const totalSpent = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
  const totalBooksOrdered = orders.reduce((sum, o) => sum + o.itemCount, 0);
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'shipped'].includes(o.status)).length;

  // Données pour les graphiques
  const dataQuantites = [
    { name: "Commandes validées", value: orders.filter(o => o.status === 'confirmed').length },
    { name: "Livraisons en cours", value: orders.filter(o => o.status === 'shipped').length },
    { name: "Livrées/Réceptionnées", value: deliveredOrders },
  ];

  const dataMontants = [
    { name: "Commandes validées", value: orders.filter(o => o.status === 'confirmed').reduce((sum, o) => sum + o.total, 0) },
    { name: "Livraisons en cours", value: orders.filter(o => o.status === 'shipped').reduce((sum, o) => sum + o.total, 0) },
    { name: "Livrées/Réceptionnées", value: totalSpent },
  ];


  // Rotation des livres recommandés
  useEffect(() => {
    if (works.length > 0) {
      const interval = setInterval(() => {
        setCurrentBookIndex((prev) => (prev + 1) % Math.min(works.length, 3));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [works]);

  const currentBook = works.length > 0 ? works[currentBookIndex] : null;

  // Ne pas utiliser DynamicDashboardLayout pendant le chargement pour éviter les conflits
  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Vous devez être connecté pour voir le tableau de bord.</p>
        </div>
      </div>
    );
  }

  return (
    <DynamicDashboardLayout title="Tableau de bord Client">
      <div className="space-y-6">
        <div className="p-4 lg:p-6">
          {/* Actions rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Link href="/dashboard/client/catalogue">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold">Explorer le catalogue</h3>
                  <p className="text-sm text-muted-foreground">Découvrir tous les livres</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/client/commandes">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold">Mes commandes</h3>
                  <p className="text-sm text-muted-foreground">{totalOrders} commande{totalOrders > 1 ? 's' : ''}</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/client/notifications">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''}` : 'Aucune nouvelle'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
          {/* Grille générale */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Card Client */}
            <div className="bg-[#6967CE] rounded-2xl p-6 text-white flex items-center justify-between shadow-lg h-40">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Client</h3>
                  <p className="text-indigo-200">+22952734444</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-yellow-500 text-yellow-900 rounded-full text-xs font-medium">
                    Client
                  </span>
                  <h4>Votre représentant</h4>
                  <p>+22952734444</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ligne stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-[#FA626B] rounded-2xl p-6 text-white shadow-lg h-40 flex items-center">
              <ShoppingCart className="w-8 h-8 mr-4 opacity-80" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Total des commandes</h3>
                <p className="text-2xl font-bold">
                  {totalOrders} <span className="text-base">Commande(s)</span>
                </p>
                <p className="text-red-100">{totalSpent.toLocaleString()} F CFA</p>
              </div>
            </div>

            <div className="bg-gray-700 rounded-2xl p-6 text-white shadow-lg h-40 flex items-center">
              <BookOpen className="w-8 h-8 mr-4 opacity-80" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Livres commandés</h3>
                <p className="text-2xl font-bold">
                  {totalBooksOrdered} <span className="text-base">Livre(s)</span>
                </p>
                <p className="text-gray-300">{pendingOrders} en cours</p>
              </div>
            </div>

            <div className="bg-[#5ED84F] rounded-2xl p-6 text-white shadow-lg h-40 flex items-center">
              <ShoppingCart className="w-8 h-8 mr-4 opacity-80" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Commandes livrées</h3>
                <p className="text-2xl font-bold">
                  {deliveredOrders} <span className="text-base">Commande(s)</span>
                </p>
                <p className="text-green-100">{totalSpent.toLocaleString()} F CFA</p>
              </div>
            </div>
          </div>

          {/* Graphiques circulaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Mes commandes (Quantités)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dataQuantites}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {dataQuantites.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Mes commandes (Montants)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dataMontants}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {dataMontants.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Liste des livres recommandés */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {works.slice(0, 3).map((work, index) => (
              <div
                key={work.id}
                className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow"
              >
                <div className="relative w-28 h-36 mb-3">
                  <Image
                    src={work.image || "/placeholder.jpg"}
                    alt={work.title}
                    fill
                    className="object-contain"
                    sizes="112px"
                  />
                </div>
                <h4 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2">
                  {work.title}
                </h4>
                <p className="text-gray-500 text-xs mb-2">
                  — {work.discipline?.name || 'Discipline inconnue'}
                </p>
                <div className="flex items-center justify-between w-full">
                  <div className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-semibold text-xs">
                    {work.price ? `${work.price.toFixed(0)} F CFA` : "Prix non défini"}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (isInCart(work.id)) {
                        toast.info("Ce livre est déjà dans votre panier")
                      } else {
                        addToCart(work)
                        toast.success(`"${work.title}" ajouté au panier`)
                      }
                    }}
                    className="text-xs"
                  >
                    {isInCart(work.id) ? "Dans le panier" : "Ajouter"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Notifications récentes */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Notifications récentes</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                  </Badge>
                )}
                <Link href="/dashboard/client/notifications">
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    Voir tout
                  </button>
                </Link>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Aucune notification</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border-l-4 ${!notification.read
                      ? 'bg-blue-50 border-l-blue-500'
                      : 'bg-gray-50 border-l-gray-300'
                      }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <span className="text-lg">
                          {notification.type === 'order' ? '📦' :
                            notification.type === 'success' ? '✅' :
                              notification.type === 'warning' ? '⚠️' :
                                notification.type === 'delivery' ? '🚚' :
                                  'ℹ️'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stock épuisé */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Livres en rupture de stock</h3>
            {works.filter(work => work.stock === 0).length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500">Tous les livres sont disponibles</p>
              </div>
            ) : (
              <div className="space-y-3">
                {works.filter(work => work.stock === 0).slice(0, 5).map((work) => (
                  <div key={work.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{work.title}</h4>
                      <p className="text-xs text-gray-500">{work.discipline?.name}</p>
                    </div>
                    <div className="text-sm text-red-600 font-medium">
                      Stock: {work.stock}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DynamicDashboardLayout>
  );
}