"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bell, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Send,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  BookOpen,
  FolderOpen,
  User,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  data?: string;
}

export function NotificationsList() {
  const { user } = useCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, currentPage, itemsPerPage]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await apiClient.getNotifications(user.id);
            
      const notificationsData = response.notifications || response || [];
      const notificationsArray = Array.isArray(notificationsData) ? notificationsData : [];
      
      setNotifications(notificationsArray);
      setTotalItems(notificationsArray.length);
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
      toast.error("Erreur lors du chargement des notifications");
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "PROJECT_ACCEPTED":
      case "WORK_APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "PROJECT_REJECTED":
      case "WORK_REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "PROJECT_SUBMITTED":
      case "WORK_SUBMITTED":
        return <Send className="h-4 w-4 text-blue-600" />;
      case "WORK_PUBLISHED":
        return <BookOpen className="h-4 w-4 text-purple-600" />;
      case "USER_APPROVED":
        return <User className="h-4 w-4 text-green-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "PROJECT_ACCEPTED":
        return "Projet accepté";
      case "PROJECT_REJECTED":
        return "Projet refusé";
      case "PROJECT_SUBMITTED":
        return "Projet soumis";
      case "WORK_APPROVED":
        return "Œuvre approuvée";
      case "WORK_REJECTED":
        return "Œuvre refusée";
      case "WORK_SUBMITTED":
        return "Œuvre soumise";
      case "WORK_PUBLISHED":
        return "Œuvre publiée";
      case "USER_APPROVED":
        return "Utilisateur approuvé";
      default:
        return "Notification";
    }
  };

  const getStatusBadge = (read: boolean) => {
    return read ? (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Lu
      </Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800">
        <Clock className="h-3 w-3 mr-1" />
        Non lu
      </Badge>
    );
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.updateNotification(notificationId, { read: true });
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      toast.success("Notification marquée comme lue");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(notif => 
          apiClient.updateNotification(notif.id, { read: true })
        )
      );
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      toast.success("Toutes les notifications ont été marquées comme lues");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiClient.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setTotalItems(prev => prev - 1);
      toast.success("Notification supprimée");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Filtrage et pagination
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getNotificationTypeLabel(notification.type).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Liste des notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 
              ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : "Toutes vos notifications sont lues"
            }
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} className="bg-purple-600 hover:bg-purple-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Marquer tout comme lu
          </Button>
        )}
      </div>

      {/* Contrôles */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Afficher</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => {
            setItemsPerPage(parseInt(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">éléments</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Rechercher:</span>
          <Input
            placeholder="Rechercher dans les notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center space-x-1">
                      <span>Type</span>
                      <div className="flex flex-col">
                        <ChevronLeft className="h-3 w-3 -mb-1" />
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center space-x-1">
                      <span>Titre</span>
                      <div className="flex flex-col">
                        <ChevronLeft className="h-3 w-3 -mb-1" />
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center space-x-1">
                      <span>Statut</span>
                      <div className="flex flex-col">
                        <ChevronLeft className="h-3 w-3 -mb-1" />
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center space-x-1">
                      <span>Date de création</span>
                      <div className="flex flex-col">
                        <ChevronLeft className="h-3 w-3 -mb-1" />
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center space-x-1">
                      <span>Date de modification</span>
                      <div className="flex flex-col">
                        <ChevronLeft className="h-3 w-3 -mb-1" />
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center space-x-1">
                      <span>Créé par</span>
                      <div className="flex flex-col">
                        <ChevronLeft className="h-3 w-3 -mb-1" />
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center space-x-1">
                      <span>Texte</span>
                      <div className="flex flex-col">
                        <ChevronLeft className="h-3 w-3 -mb-1" />
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Bell className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Aucune notification trouvée
                        </h3>
                        <p className="text-gray-500">
                          {searchTerm 
                            ? "Aucune notification ne correspond à votre recherche."
                            : "Vous n'avez pas encore de notifications."
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedNotifications.map((notification) => (
                    <tr key={notification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getNotificationIcon(notification.type)}
                          <span className="text-sm font-medium text-gray-900">
                            {getNotificationTypeLabel(notification.type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(notification.read)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(notification.createdAt), "EEE d MMM yyyy HH:mm", { locale: fr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {notification.read 
                          ? format(new Date(notification.createdAt), "yyyy-MM-dd'T'HH:mm:ssXXX")
                          : "Pas de modification"
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          {user?.name || "Utilisateur"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {notification.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              title="Marquer comme lu"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            title="Supprimer"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredNotifications.length)} sur {filteredNotifications.length} éléments
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
              Premier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Dernier
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
