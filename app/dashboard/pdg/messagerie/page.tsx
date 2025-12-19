"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  Send,
  MessageSquare,
  User,
  Mail,
  Plus,
  GraduationCap,
  Building2,
  Users,
  BookOpen,
  UserCheck,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface Message {
  id: string
  subject: string
  content: string
  sender: {
    id: string
    name: string
    email: string
    role: string
  }
  recipient: {
    id: string
    name: string
    email: string
    role: string
  }
  sentAt: string
  readAt?: string
  isRead: boolean
  priority: 'LOW' | 'NORMAL' | 'HIGH'
  type: 'INTERNAL' | 'WORK_REVIEW' | 'ORDER_UPDATE' | 'GENERAL'
}

interface Conversation {
  id: string
  participant: {
    id: string
    name: string
    email: string
    role: string
  }
  lastMessage: Message
  unreadCount: number
  messages: Message[]
}

export default function PDGMessageriePage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [recipients, setRecipients] = useState<Array<{ id: string; name: string; email: string; role: string; category?: string }>>([])
  const [recipientsByCategory, setRecipientsByCategory] = useState<any>({})
  const [newMessageData, setNewMessageData] = useState({
    recipientId: "",
    subject: "",
    content: "",
    priority: "NORMAL" as 'LOW' | 'NORMAL' | 'HIGH',
    type: "GENERAL" as 'INTERNAL' | 'WORK_REVIEW' | 'ORDER_UPDATE' | 'GENERAL'
  })

  // Load data
  useEffect(() => {
    loadConversations()
    loadRecipients()
  }, [])

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pdg/messages')
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setConversations(data)
    } catch (error: any) {
      toast.error("Erreur lors du chargement des conversations")
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/pdg/messages?conversationId=${conversationId}`)
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      const loadedMessages = data.messages || data
      setMessages(loadedMessages)
      
      // Marquer les messages non lus comme lus
      const unreadMessages = loadedMessages.filter((m: Message) => !m.isRead && m.recipient.role === 'PDG')
      for (const msg of unreadMessages) {
        try {
          await fetch('/api/messages', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: msg.id, read: true })
          })
        } catch (e) {
          console.error('Erreur lors du marquage du message comme lu:', e)
        }
      }
      
      // Recharger les conversations pour mettre à jour le compteur de non lus
      if (unreadMessages.length > 0) {
        loadConversations()
      }
    } catch (error: any) {
      toast.error("Erreur lors du chargement des messages")
    }
  }

  const loadRecipients = async () => {
    try {
      const response = await fetch('/api/pdg/recipients')
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setRecipients(data.recipients || [])
      setRecipientsByCategory(data.recipientsByCategory || {})
    } catch (error: any) {
      console.error("Erreur lors du chargement des destinataires:", error)
      toast.error("Erreur lors du chargement des destinataires")
    }
  }

  const getRoleLabel = (role: string, category?: string) => {
    if (category === 'ECOLE') return 'École'
    if (role === 'REPRESENTANT') return 'Représentant'
    if (role === 'PARTENAIRE') return 'Partenaire'
    if (role === 'AUTEUR') return 'Auteur'
    if (role === 'CONCEPTEUR') return 'Concepteur'
    if (role === 'CLIENT') return 'Client'
    return role
  }

  const getRoleBadge = (role: string, category?: string) => {
    const label = getRoleLabel(role, category)
    if (category === 'ECOLE' || role === 'CLIENT') {
      return <Badge className="bg-green-100 text-green-800">{label}</Badge>
    }
    if (role === 'REPRESENTANT') {
      return <Badge className="bg-blue-100 text-blue-800">{label}</Badge>
    }
    if (role === 'PARTENAIRE') {
      return <Badge className="bg-purple-100 text-purple-800">{label}</Badge>
    }
    if (role === 'AUTEUR') {
      return <Badge className="bg-orange-100 text-orange-800">{label}</Badge>
    }
    if (role === 'CONCEPTEUR') {
      return <Badge className="bg-indigo-100 text-indigo-800">{label}</Badge>
    }
    return <Badge variant="secondary">{label}</Badge>
  }

  const getRoleIcon = (role: string, category?: string) => {
    if (category === 'ECOLE') return <GraduationCap className="h-4 w-4" />
    if (role === 'REPRESENTANT') return <UserCheck className="h-4 w-4" />
    if (role === 'PARTENAIRE') return <Building2 className="h-4 w-4" />
    if (role === 'AUTEUR') return <BookOpen className="h-4 w-4" />
    if (role === 'CONCEPTEUR') return <Users className="h-4 w-4" />
    return <User className="h-4 w-4" />
  }

  const handleSendMessage = async () => {
    try {
      if (!newMessage.trim()) {
        toast.error("Veuillez saisir un message")
        return
      }

      if (!selectedConversation?.participant) {
        toast.error("Aucune conversation sélectionnée")
        return
      }

      await apiClient.sendMessage({
        recipientId: selectedConversation.participant.id,
        subject: "Réponse",
        content: newMessage
      })
      
      toast.success("Message envoyé")
      setNewMessage("")
      if (selectedConversation) {
        loadMessages(selectedConversation.id)
        loadConversations()
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi du message")
    }
  }

  const handleSendNewMessage = async () => {
    try {
      if (!newMessageData.recipientId || !newMessageData.subject || !newMessageData.content) {
        toast.error("Veuillez remplir tous les champs obligatoires")
        return
      }

      await apiClient.sendMessage({
        recipientId: newMessageData.recipientId,
        subject: newMessageData.subject,
        content: newMessageData.content
      })
      
      toast.success("Message envoyé")
      setShowNewMessageModal(false)
      setNewMessageData({
        recipientId: "",
        subject: "",
        content: "",
        priority: "NORMAL",
        type: "GENERAL"
      })
      loadConversations()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi du message")
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>
      case 'NORMAL':
        return <Badge className="bg-blue-100 text-blue-800">Normal</Badge>
      case 'LOW':
        return <Badge className="bg-gray-100 text-gray-800">Faible</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WORK_REVIEW':
        return <MessageSquare className="h-4 w-4 text-blue-600" />
      case 'ORDER_UPDATE':
        return <Mail className="h-4 w-4 text-green-600" />
      case 'INTERNAL':
        return <Mail className="h-4 w-4 text-orange-600" />
      default:
        return <Mail className="h-4 w-4 text-gray-600" />
    }
  }

  // Filtrer les conversations par recherche
  const filteredConversations = conversations.filter(conv => 
    conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement de la messagerie...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messagerie</h1>
          <p className="text-gray-600">Communiquez avec tous les utilisateurs du système</p>
        </div>
        <Button onClick={() => setShowNewMessageModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Message
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conversations</CardTitle>
                <Badge variant="secondary">{filteredConversations.length}</Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 max-h-[calc(100vh-350px)] overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Aucune conversation</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                        selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <p className="font-medium text-sm truncate">
                              {conversation.participant.name}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-red-500 text-white text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            {getRoleIcon(conversation.participant.role, (conversation.participant as any).category)}
                            {getRoleBadge(conversation.participant.role, (conversation.participant as any).category)}
                          </div>
                          <p className="text-sm text-gray-700 truncate mt-1">
                            {conversation.lastMessage.subject}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.lastMessage.content}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {getTypeIcon(conversation.lastMessage.type)}
                          <span className="text-xs text-gray-500">
                            {new Date(conversation.lastMessage.sentAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            {selectedConversation ? (
              <>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>{selectedConversation.participant.name}</span>
                        <Badge variant="outline">{selectedConversation.participant.role}</Badge>
                      </CardTitle>
                      <CardDescription>{selectedConversation.participant.email}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => {
                      const isFromPDG = message.sender.role === 'PDG'
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isFromPDG ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              isFromPDG
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              {getTypeIcon(message.type)}
                              <span className="font-medium text-sm">{message.subject}</span>
                              {getPriorityBadge(message.priority)}
                            </div>
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                              <span>{message.sender.name}</span>
                              <span>{new Date(message.sentAt).toLocaleString('fr-FR')}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Tapez votre message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez une conversation</h3>
                  <p className="text-gray-600">Choisissez une conversation pour commencer à échanger.</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* New Message Modal */}
      <Dialog open={showNewMessageModal} onOpenChange={setShowNewMessageModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau Message</DialogTitle>
            <DialogDescription>
              Envoyer un message à un représentant, une école, un partenaire, un auteur ou un concepteur
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient">Destinataire *</Label>
              <Select
                value={newMessageData.recipientId}
                onValueChange={(value) => setNewMessageData(prev => ({ ...prev, recipientId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un destinataire" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  {/* Représentants */}
                  {recipientsByCategory.REPRESENTANT && recipientsByCategory.REPRESENTANT.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Représentants</div>
                      {recipientsByCategory.REPRESENTANT.map((recipient: any) => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          <div className="flex items-center space-x-2">
                            <UserCheck className="h-4 w-4 text-blue-500" />
                            <span>{recipient.name}</span>
                            <span className="text-xs text-gray-500">({recipient.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* Écoles */}
                  {recipientsByCategory.ECOLE && recipientsByCategory.ECOLE.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Écoles</div>
                      {recipientsByCategory.ECOLE.map((recipient: any) => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="h-4 w-4 text-green-500" />
                            <span>{recipient.name}</span>
                            <span className="text-xs text-gray-500">({recipient.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* Partenaires */}
                  {recipientsByCategory.PARTENAIRE && recipientsByCategory.PARTENAIRE.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Partenaires</div>
                      {recipientsByCategory.PARTENAIRE.map((recipient: any) => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-purple-500" />
                            <span>{recipient.name}</span>
                            <span className="text-xs text-gray-500">({recipient.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* Auteurs */}
                  {recipientsByCategory.AUTEUR && recipientsByCategory.AUTEUR.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Auteurs</div>
                      {recipientsByCategory.AUTEUR.map((recipient: any) => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-orange-500" />
                            <span>{recipient.name}</span>
                            <span className="text-xs text-gray-500">({recipient.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* Concepteurs */}
                  {recipientsByCategory.CONCEPTEUR && recipientsByCategory.CONCEPTEUR.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Concepteurs</div>
                      {recipientsByCategory.CONCEPTEUR.map((recipient: any) => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-indigo-500" />
                            <span>{recipient.name}</span>
                            <span className="text-xs text-gray-500">({recipient.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* Autres clients */}
                  {recipientsByCategory.CLIENT && recipientsByCategory.CLIENT.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Autres clients</div>
                      {recipientsByCategory.CLIENT.map((recipient: any) => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span>{recipient.name}</span>
                            <span className="text-xs text-gray-500">({recipient.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
              <div>
                <Label htmlFor="subject">Sujet *</Label>
                <Input
                  id="subject"
                  value={newMessageData.subject}
                  onChange={(e) => setNewMessageData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Sujet du message"
                />
              </div>
            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={newMessageData.priority}
                onValueChange={(value: any) => setNewMessageData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Faible</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="content">Message *</Label>
              <Textarea
                id="content"
                value={newMessageData.content}
                onChange={(e) => setNewMessageData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Contenu du message"
                rows={6}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNewMessageModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleSendNewMessage}>
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

