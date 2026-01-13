"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  MessageSquare, 
  Send,
  Plus,
  Search,
  User,
  Calendar,
  Mail,
  MailOpen,
  Reply,
  Trash2,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Message {
  id: string;
  subject: string;
  content: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
  recipient: {
    id: string;
    name: string;
    role: string;
  };
  read: boolean;
  createdAt: string;
  type: "sent" | "received";
}

export default function MessagesPage() {
  const { user } = useCurrentUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [recipients, setRecipients] = useState<Array<{ id: string; name: string; role: string; email: string }>>([]);
  
  // Formulaire de nouveau message
  const [newMessage, setNewMessage] = useState({
    recipient: "",
    subject: "",
    content: ""
  });

  useEffect(() => {
    if (user && user.role === "CONCEPTEUR") {
      loadMessages();
      loadRecipients();
    }
  }, [user, filter, searchTerm]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        filter: filter,
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/concepteur/messages?${params}`);
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setMessages(data.messages || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Erreur lors du chargement des messages");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecipients = async () => {
    try {
      const response = await fetch("/api/users/list?role=PDG");
      if (response.ok) {
        const data = await response.json();
        setRecipients(data.users || []);
      }
    } catch (error) {
      console.error("Error loading recipients:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.subject.trim() || !newMessage.content.trim() || !newMessage.recipient) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      const response = await fetch("/api/concepteur/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: newMessage.recipient,
          subject: newMessage.subject.trim(),
          content: newMessage.content.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'envoi");
      }

      toast.success("Message envoyé avec succès");
      setNewMessage({ recipient: "", subject: "", content: "" });
      setIsComposeOpen(false);
      loadMessages();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi du message");
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const response = await fetch("/api/concepteur/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, read: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour");
      }

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/concepteur/messages?id=${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      toast.success("Message supprimé");
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      loadMessages();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    
    setNewMessage({
      recipient: selectedMessage.type === "received" ? selectedMessage.sender.id : selectedMessage.recipient.id,
      subject: `Re: ${selectedMessage.subject}`,
      content: `\n\n--- Message original ---\n${selectedMessage.content}`
    });
    setIsComposeOpen(true);
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (message.type === "received" ? message.sender.name : message.recipient.name).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (!user || user.role !== "CONCEPTEUR") {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-muted-foreground">Accès non autorisé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <MessageSquare className="h-8 w-8" />
            <span>Messages</span>
          </h1>
          <p className="text-muted-foreground">
            Communication avec l'équipe administrative
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadMessages}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Nouveau message</DialogTitle>
                <DialogDescription>
                  Envoyez un message à l'équipe administrative
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Destinataire</Label>
                  <Select value={newMessage.recipient} onValueChange={(value) => setNewMessage(prev => ({ ...prev, recipient: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner un destinataire" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipients.map((recipient) => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          {recipient.name} ({recipient.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Sujet</Label>
                  <Input
                    placeholder="Sujet du message"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Votre message..."
                    value={newMessage.content}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={(value) => { setFilter(value); }}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les messages</SelectItem>
            <SelectItem value="unread">Non lus</SelectItem>
            <SelectItem value="received">Reçus</SelectItem>
            <SelectItem value="sent">Envoyés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des messages */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Messages ({filteredMessages.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 text-muted-foreground mb-4 animate-spin" />
                  <p className="text-muted-foreground">Chargement...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    {searchTerm || filter !== "all" 
                      ? "Aucun message trouvé"
                      : "Aucun message"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.read && message.type === "received") {
                          handleMarkAsRead(message.id);
                        }
                      }}
                      className={`p-4 cursor-pointer border-b hover:bg-muted/50 transition-colors ${
                        selectedMessage?.id === message.id ? "bg-muted" : ""
                      } ${!message.read && message.type === "received" ? "bg-blue-50" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {message.type === "received" ? (
                              message.read ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Send className="h-4 w-4 text-green-600" />
                            )}
                            <span className="text-sm font-medium truncate">
                              {message.type === "received" ? message.sender.name : message.recipient.name}
                            </span>
                          </div>
                          <h4 className={`text-sm truncate mt-1 ${
                            !message.read && message.type === "received" ? "font-semibold" : "font-normal"
                          }`}>
                            {message.subject}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {message.content.substring(0, 60)}...
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), "dd/MM", { locale: fr })}
                          </span>
                          {!message.read && message.type === "received" && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Détails du message */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                      <CardDescription>
                        {selectedMessage.type === "received" 
                          ? `De: ${selectedMessage.sender.name} (${selectedMessage.sender.role})`
                          : `À: ${selectedMessage.recipient.name} (${selectedMessage.recipient.role})`
                        }
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedMessage.createdAt}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-sm">
                      {selectedMessage.content}
                    </p>
                  </div>
                  
                  {selectedMessage.type === "received" && (
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={handleReply}>
                        <Reply className="h-4 w-4 mr-2" />
                        Répondre
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sélectionnez un message</h3>
                <p className="text-muted-foreground text-center">
                  Choisissez un message dans la liste pour le lire
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
