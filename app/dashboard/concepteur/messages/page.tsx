"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  AlertTriangle
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

const mockMessages: Message[] = [
  {
    id: "1",
    subject: "Validation de votre projet 'Manuel d'Histoire'",
    content: "Bonjour,\n\nVotre projet 'Manuel d'Histoire' a été validé avec succès. Vous pouvez maintenant commencer à créer les œuvres associées.\n\nCordialement,\nL'équipe PDG",
    sender: { id: "pdg1", name: "Marie Dubois", role: "PDG" },
    recipient: { id: "concepteur1", name: "Jean Martin", role: "CONCEPTEUR" },
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    type: "received"
  },
  {
    id: "2",
    subject: "Question sur les droits d'auteur",
    content: "Bonjour,\n\nJ'aurais une question concernant les droits d'auteur pour mon prochain projet. Pourriez-vous m'éclairer sur la procédure ?\n\nMerci d'avance,\nJean Martin",
    sender: { id: "concepteur1", name: "Jean Martin", role: "CONCEPTEUR" },
    recipient: { id: "pdg1", name: "Marie Dubois", role: "PDG" },
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    type: "sent"
  }
];

export default function MessagesPage() {
  const { user } = useCurrentUser();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  
  // Formulaire de nouveau message
  const [newMessage, setNewMessage] = useState({
    recipient: "",
    subject: "",
    content: ""
  });

  const handleSendMessage = () => {
    if (!newMessage.subject.trim() || !newMessage.content.trim() || !newMessage.recipient) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      subject: newMessage.subject.trim(),
      content: newMessage.content.trim(),
      sender: { id: user?.id || "", name: user?.name || "", role: user?.role || "" },
      recipient: { id: "pdg1", name: "Marie Dubois", role: "PDG" }, // Simplifié pour l'exemple
      read: false,
      createdAt: new Date().toISOString(),
      type: "sent"
    };

    setMessages(prev => [message, ...prev]);
    setNewMessage({ recipient: "", subject: "", content: "" });
    setIsComposeOpen(false);
    toast.success("Message envoyé avec succès");
  };

  const handleMarkAsRead = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    ));
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    if (selectedMessage?.id === messageId) {
      setSelectedMessage(null);
    }
    toast.success("Message supprimé");
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === "all" || 
                         (filter === "unread" && !message.read) ||
                         (filter === "sent" && message.type === "sent") ||
                         (filter === "received" && message.type === "received");
    
    return matchesSearch && matchesFilter;
  });

  const unreadCount = messages.filter(m => !m.read && m.type === "received").length;

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
                <label className="text-sm font-medium">Destinataire</label>
                <Select value={newMessage.recipient} onValueChange={(value) => setNewMessage(prev => ({ ...prev, recipient: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner un destinataire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdg">PDG - Marie Dubois</SelectItem>
                    <SelectItem value="admin">Administration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Sujet</label>
                <Input
                  placeholder="Sujet du message"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Votre message..."
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="mt-1"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
        <Select value={filter} onValueChange={setFilter}>
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
              {filteredMessages.length === 0 ? (
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
                      {format(new Date(selectedMessage.createdAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
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
                      <Button variant="outline" size="sm">
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
