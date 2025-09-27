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
  Calendar,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Filter,
  Archive,
  Trash2
} from "lucide-react"
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

export default function MessageriePage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [newMessage, setNewMessage] = useState("")
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
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
      const data = await apiClient.getRepresentantConversations()
      setConversations(data)
    } catch (error: any) {
      toast.error("Erreur lors du chargement des conversations")
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await apiClient.getRepresentantMessages(conversationId)
      setMessages(data)
    } catch (error: any) {
      toast.error("Erreur lors du chargement des messages")
    }
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

      await apiClient.sendRepresentantMessage({
        recipientId: selectedConversation.participant.id,
        subject: "Réponse",
        content: newMessage,
        conversationId: selectedConversation.id
      })
      
      toast.success("Message envoyé")
      setNewMessage("")
      if (selectedConversation) {
        loadMessages(selectedConversation.id)
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

      await apiClient.sendRepresentantMessage(newMessageData)
      
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
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'INTERNAL':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <Mail className="h-4 w-4 text-gray-600" />
    }
  }

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
          <p className="text-gray-600">Communiquez avec le PDG et vos auteurs</p>
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
                <Badge variant="secondary">{conversations.length}</Badge>
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
                {conversations.map((conversation) => (
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
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.participant.role}
                        </p>
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
                ))}
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
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender.role === 'REPRESENTANT' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.sender.role === 'REPRESENTANT'
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
                    ))}
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
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nouveau Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="recipient">Destinataire *</Label>
                <select
                  id="recipient"
                  value={newMessageData.recipientId}
                  onChange={(e) => setNewMessageData(prev => ({ ...prev, recipientId: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Sélectionner un destinataire</option>
                  <option value="1">PDG LAHA (pdg@laha.gabon)</option>
                  <option value="3">Jean Auteur (jean.auteur@example.com)</option>
                  <option value="4">Marie Écrivaine (marie.ecrivaine@example.com)</option>
                </select>
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
                <select
                  id="priority"
                  value={newMessageData.priority}
                  onChange={(e) => setNewMessageData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="LOW">Faible</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Urgent</option>
                </select>
              </div>
              <div>
                <Label htmlFor="content">Message *</Label>
                <Textarea
                  id="content"
                  value={newMessageData.content}
                  onChange={(e) => setNewMessageData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Contenu du message"
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewMessageModal(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSendNewMessage}>
                  Envoyer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
