// Client API pour les appels frontend
export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`
        throw new Error(errorMessage)
      }

      return response.json()
    } catch (error) {
      // Si c'est déjà une Error avec un message, la relancer
      if (error instanceof Error) {
        throw error
      }
      // Sinon, créer une nouvelle Error
      throw new Error(typeof error === 'string' ? error : 'Erreur réseau')
    }
  }

  // Users API
  async getUsers() {
    const response = await this.request('/users')
    return response.users || response || []
  }

  async getUserProfile() {
    return this.request('/users/profile')
  }

  async createUser(data: {
    name: string,
    email: string,
    phone?: string,
    role: string,
    disciplineId?: string,
    password?: string
  }) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Inscription publique (pour les utilisateurs)
  async signup(data: {
    name: string,
    email: string,
    phone: string,
    role: string,
    disciplineId?: string,
    password: string
  }) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateUser(userId: string, data: any) {
    return this.request('/users', {
      method: 'PUT',
      body: JSON.stringify({ id: userId, ...data }),
    })
  }

  async deleteUser(userId: string) {
    return this.request(`/users?id=${userId}`, {
      method: 'DELETE',
    })
  }

  async getPendingUsers(status?: string) {
    const response = await this.request(`/users/validate${status ? `?status=${status}` : ''}`)
    return response.users || response || []
  }

  async getUsersList(role?: string, search?: string) {
    const params = new URLSearchParams()
    if (role) params.append('role', role)
    if (search) params.append('search', search)

    return this.request(`/users/list?${params.toString()}`)
  }

  async validateUser(userId: string, status: 'APPROVED' | 'REJECTED') {
    return this.request('/users/validate', {
      method: 'PUT',
      body: JSON.stringify({ userId, status }),
    })
  }

  // Orders API
  async getOrders(params?: { status?: string, startDate?: string, endDate?: string }) {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)

    const queryString = queryParams.toString()
    return this.request(`/orders${queryString ? `?${queryString}` : ''}`)
  }

  async createOrder(data: {
    userId: string,
    items: Array<{ workId: string, quantity: number, price: number }>,
    promoCode?: string | null,
    discountAmount?: number
  }) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateOrder(orderId: string, data: { status: string }) {
    return this.request('/orders', {
      method: 'PUT',
      body: JSON.stringify({ id: orderId, status: data.status }),
    })
  }

  async deleteOrder(orderId: string) {
    return this.request(`/orders?id=${orderId}`, {
      method: 'DELETE',
    })
  }

  // Stock API
  async getWorksWithStock() {
    return this.request('/stock?type=works')
  }

  async getStockMovements(params?: { startDate?: string, endDate?: string, type?: string }) {
    const queryParams = new URLSearchParams({ type: 'movements' })
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.type) queryParams.append('movementType', params.type)

    return this.request(`/stock?${queryParams}`)
  }

  async getStockAlerts() {
    return this.request('/stock?type=alerts')
  }

  async getStockStats() {
    return this.request('/stock?type=stats')
  }

  async getPendingStockOperations() {
    return this.request('/stock?type=pending')
  }

  async createStockMovement(data: { workId: string, type: string, quantity: number, reason?: string, reference?: string, performedBy?: string }) {
    return this.request('/stock', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async validateStockOperation(operationId: string, validated: boolean) {
    return this.request('/stock', {
      method: 'PUT',
      body: JSON.stringify({ id: operationId, validated }),
    })
  }

  async exportStockReport(params?: { startDate?: string, endDate?: string, format?: string }) {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.format) queryParams.append('format', params.format)

    const queryString = queryParams.toString()
    return this.request(`/stock/export${queryString ? `?${queryString}` : ''}`)
  }

  // Works API
  async getWorks(params?: { status?: string, disciplineId?: string, search?: string, page?: number, limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.disciplineId) queryParams.append('disciplineId', params.disciplineId)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const queryString = queryParams.toString()
    const response = await this.request(`/works${queryString ? `?${queryString}` : ''}`)

    // L'API retourne { works, pagination, stats }, on extrait juste works
    return response.works || response || []
  }

  async updateWorkStatus(workId: string, status: string, reason?: string) {
    return this.request('/works', {
      method: 'PUT',
      body: JSON.stringify({ id: workId, status, reason }),
    })
  }

  async deleteWork(workId: string) {
    return this.request(`/works?id=${workId}`, {
      method: 'DELETE',
    })
  }

  // Projects API
  async getProjects(concepteurId?: string) {
    const url = concepteurId ? `/projects?concepteurId=${concepteurId}` : '/projects';
    return this.request(url)
  }

  async getValidatedProjects() {
    return this.request('/projects?status=ACCEPTED')
  }

  async createProject(data: {
    title: string,
    disciplineId: string,
    concepteurId: string,
    description?: string,
    status?: string
  }) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // API spécifique pour les Concepteurs
  async getConcepteurProjects(concepteurId: string, status?: string) {
    const url = status ? `/concepteurs/projects?concepteurId=${concepteurId}&status=${status}` : `/concepteurs/projects?concepteurId=${concepteurId}`
    return this.request(url)
  }

  async createConcepteurProject(data: any) {
    return this.request('/concepteurs/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async submitConcepteurProject(projectId: string) {
    return this.request('/projects', {
      method: 'PUT',
      body: JSON.stringify({ id: projectId, status: 'SUBMITTED' }),
    })
  }

  async archiveConcepteurProject(projectId: string) {
    return this.request('/concepteurs/projects', {
      method: 'PUT',
      body: JSON.stringify({ projectId, status: 'ARCHIVED' }),
    })
  }

  async updateConcepteurProject(projectId: string, data: any) {
    return this.request('/projects', {
      method: 'PUT',
      body: JSON.stringify({ id: projectId, ...data }),
    })
  }

  async updateProject(projectId: string, data: any) {
    return this.request('/projects', {
      method: 'PUT',
      body: JSON.stringify({ id: projectId, ...data }),
    })
  }

  async deleteProject(projectId: string) {
    return this.request(`/projects/${projectId}`, {
      method: 'DELETE',
    })
  }

  async createWork(data: any) {
    return this.request('/works', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateWork(workId: string, data: any) {
    return this.request('/works', {
      method: 'PUT',
      body: JSON.stringify({ workId, ...data }),
    })
  }

  // API spécifique pour les Auteurs
  async getAuthorWorks(authorId: string, status?: string) {
    const url = status ? `/authors/works?authorId=${authorId}&status=${status}` : `/authors/works?authorId=${authorId}`
    return this.request(url)
  }

  async createAuthorWork(data: any) {
    return this.request('/authors/works', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getAuthorDashboard() {
    return this.request('/auteur/dashboard')
  }

  async getAuthorRoyalties() {
    return this.request('/auteur/royalties')
  }

  async getAuthorWithdrawals() {
    return this.request('/auteur/withdrawals')
  }

  async createWithdrawal(data: any) {
    return this.request('/auteur/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Notifications API
  async createNotification(data: any) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getNotifications(userId: string, unreadOnly?: boolean) {
    const url = unreadOnly
      ? `/notifications?userId=${userId}&unreadOnly=true`
      : `/notifications?userId=${userId}`
    return this.request(url)
  }

  async updateNotification(notificationId: string, data: any) {
    return this.request('/notifications', {
      method: 'PUT',
      body: JSON.stringify({ notificationId, ...data }),
    })
  }

  async deleteNotification(notificationId: string) {
    return this.request(`/notifications?id=${notificationId}`, {
      method: 'DELETE',
    })
  }

  // Project API - Individual project
  async getProject(projectId: string) {
    return this.request(`/projects/${projectId}`)
  }

  // Messages API
  async getMessages(userId: string) {
    return this.request(`/messages?userId=${userId}`)
  }

  async sendMessage(data: any) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async markMessageAsRead(messageId: string) {
    return this.request('/messages', {
      method: 'PUT',
      body: JSON.stringify({ messageId, read: true }),
    })
  }

  async deleteMessage(messageId: string) {
    return this.request(`/messages?id=${messageId}`, {
      method: 'DELETE',
    })
  }

  // Upload API
  async uploadFiles(files: File[], type: string, entityId?: string) {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    formData.append('type', type)
    if (entityId) formData.append('entityId', entityId)

    return fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Ne pas définir Content-Type, le navigateur le fera automatiquement avec boundary
      }
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
  }

  async deleteUploadedFile(filename: string, type: string) {
    return this.request(`/upload?filename=${filename}&type=${type}`, {
      method: 'DELETE',
    })
  }

  async getUploadedFiles(type?: string, entityId?: string) {
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    if (entityId) params.append('entityId', entityId)

    return this.request(`/upload?${params.toString()}`)
  }

  // Disciplines API
  async getDisciplines(params?: { search?: string; includeInactive?: boolean }) {
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.append('search', params.search)
    if (params?.includeInactive) queryParams.append('includeInactive', 'true')

    const queryString = queryParams.toString()
    return this.request(`/disciplines${queryString ? `?${queryString}` : ''}`)
  }

  async createDiscipline(data: any) {
    return this.request('/disciplines', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDiscipline(disciplineId: string, data: any) {
    return this.request('/disciplines', {
      method: 'PUT',
      body: JSON.stringify({ id: disciplineId, ...data }),
    })
  }

  async deleteDiscipline(disciplineId: string, force = false) {
    const params = new URLSearchParams()
    params.append('id', disciplineId)
    if (force) params.append('force', 'true')
    return this.request(`/disciplines?${params.toString()}`, {
      method: 'DELETE',
    })
  }




  // Partners API
  async getPartners(params?: { search?: string, type?: string, status?: string, page?: number, limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.append('search', params.search)
    if (params?.type) queryParams.append('type', params.type)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const queryString = queryParams.toString()
    return this.request(`/partners${queryString ? `?${queryString}` : ''}`)
  }

  async updatePartner(partnerId: string, data: { status?: string, reason?: string, representantId?: string }) {
    return this.request('/partners', {
      method: 'PUT',
      body: JSON.stringify({ id: partnerId, ...data }),
    })
  }

  async deletePartner(partnerId: string) {
    return this.request(`/partners?id=${partnerId}`, {
      method: 'DELETE',
    })
  }

  // Financial API
  async getFinancialOverview(startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ type: 'overview' })
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    return this.request(`/finance?${params}`)
  }

  async getSalesReport(startDate?: string, endDate?: string, disciplineId?: string, partnerId?: string) {
    const params = new URLSearchParams({ type: 'sales' })
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (disciplineId) params.append('disciplineId', disciplineId)
    if (partnerId) params.append('partnerId', partnerId)

    return this.request(`/finance?${params}`)
  }

  async getRoyaltiesReport(startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ type: 'royalties' })
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    return this.request(`/finance?${params}`)
  }

  async getPartnerPerformance(startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ type: 'partner_performance' })
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    return this.request(`/finance?${params}`)
  }

  async exportFinancialReport(params?: { type?: string, startDate?: string, endDate?: string, format?: string }) {
    const queryParams = new URLSearchParams()
    if (params?.type) queryParams.append('type', params.type)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.format) queryParams.append('format', params.format)

    const queryString = queryParams.toString()
    return this.request(`/finance/export${queryString ? `?${queryString}` : ''}`)
  }

  // Settings API
  async getSettings(category?: string) {
    const params = category ? `?category=${category}` : ''
    return this.request(`/settings${params}`)
  }

  async updateSettings(category: string, settings: any) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify({ category, settings }),
    })
  }

  async resetSettingsToDefaults(category: string) {
    return this.request('/settings', {
      method: 'POST',
      body: JSON.stringify({ action: 'reset_to_defaults', category }),
    })
  }

  async exportSettings(category?: string) {
    const params = category ? `?category=${category}` : ''
    return this.request(`/settings/export${params}`)
  }

  async validateSettings(category: string, settings: any) {
    return this.request('/settings', {
      method: 'POST',
      body: JSON.stringify({ action: 'validate_settings', category, settings }),
    })
  }

  // Notifications API
  async getNotifications(userId: string) {
    return this.request(`/notifications?userId=${userId}`)
  }

  // Work Versions API
  async getWorkVersions(workId: string, includeArchived: boolean = false) {
    const params = new URLSearchParams({ workId })
    if (includeArchived) params.append('includeArchived', 'true')
    return this.request(`/works/versions?${params}`)
  }

  async createWorkVersion(data: {
    workId: string
    version: string
    title: string
    description?: string
    publishedAt?: string
  }) {
    return this.request('/works/versions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async archiveWorkVersion(versionId: string, isActive: boolean) {
    return this.request('/works/versions', {
      method: 'PUT',
      body: JSON.stringify({ versionId, isActive }),
    })
  }

  // Stock API
  async getWorksWithStock() {
    return this.request('/stock?type=works')
  }

  async getStockMovements() {
    return this.request('/stock?type=movements')
  }

  async getStockAlerts() {
    return this.request('/stock?type=alerts')
  }

  async getStockStats() {
    return this.request('/stock?type=stats')
  }

  async getPendingStockOperations() {
    return this.request('/stock?type=pending')
  }

  async exportStockReport(type: 'inventory' | 'movements' | 'alerts') {
    return this.request(`/stock/export?type=${type}`)
  }

  async validateStockOperation(operationId: string, approved: boolean) {
    return this.request('/stock/validate', {
      method: 'POST',
      body: JSON.stringify({ operationId, approved }),
    })
  }

  // Stock Statistics API
  async getStockStatistics(type: 'discipline' | 'sales' | 'popular' | 'overview', options?: {
    period?: number
    disciplineId?: string
  }) {
    const params = new URLSearchParams({ type })
    if (options?.period) params.append('period', options.period.toString())
    if (options?.disciplineId) params.append('disciplineId', options.disciplineId)
    return this.request(`/stock/statistics?${params}`)
  }

  // Stock Alerts API
  async getStockAlerts(type: 'rules' | 'alerts' | 'unread', options?: {
    severity?: string
    isResolved?: boolean
    limit?: number
  }) {
    const params = new URLSearchParams({ type })
    if (options?.severity) params.append('severity', options.severity)
    if (options?.isResolved !== undefined) params.append('isResolved', options.isResolved.toString())
    if (options?.limit) params.append('limit', options.limit.toString())
    return this.request(`/stock/alerts?${params}`)
  }

  async createAlertRule(data: {
    name: string
    description?: string
    type: string
    conditions: any
    actions: any
    priority?: string
  }) {
    return this.request('/stock/alerts', {
      method: 'POST',
      body: JSON.stringify({ action: 'create_rule', ...data }),
    })
  }

  async updateAlertRule(ruleId: string, data: {
    name?: string
    description?: string
    type?: string
    conditions?: any
    actions?: any
    priority?: string
    isActive?: boolean
  }) {
    return this.request('/stock/alerts', {
      method: 'PUT',
      body: JSON.stringify({ ruleId, ...data }),
    })
  }

  async deleteAlertRule(ruleId: string) {
    return this.request(`/stock/alerts?ruleId=${ruleId}`, {
      method: 'DELETE',
    })
  }

  async markAlertAsRead(alertId: string) {
    return this.request('/stock/alerts', {
      method: 'POST',
      body: JSON.stringify({ action: 'mark_read', alertId }),
    })
  }

  async resolveAlert(alertId: string, resolution?: string) {
    return this.request('/stock/alerts', {
      method: 'POST',
      body: JSON.stringify({ action: 'resolve', alertId, resolution }),
    })
  }

  // Stock Reports API
  async getStockReports(type: 'reports' | 'executions' | 'generate', options?: {
    reportId?: string
    reportType?: string
  }) {
    const params = new URLSearchParams({ type })
    if (options?.reportId) params.append('reportId', options.reportId)
    if (options?.reportType) params.append('reportType', options.reportType)
    return this.request(`/stock/reports?${params}`)
  }

  async createStockReport(data: {
    name: string
    type: string
    parameters: any
    schedule?: string
  }) {
    return this.request('/stock/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateStockReport(reportId: string, data: {
    name?: string
    type?: string
    parameters?: any
    schedule?: string
    isActive?: boolean
  }) {
    return this.request('/stock/reports', {
      method: 'PUT',
      body: JSON.stringify({ reportId, ...data }),
    })
  }

  async deleteStockReport(reportId: string) {
    return this.request(`/stock/reports?reportId=${reportId}`, {
      method: 'DELETE',
    })
  }

  async generateReport(reportType: string) {
    return this.request(`/stock/reports?type=generate&reportType=${reportType}`)
  }

  // Stock Integrations API
  async getStockIntegrations(type: 'list' | 'status' | 'sync', options?: {
    integrationId?: string
  }) {
    const params = new URLSearchParams({ type })
    if (options?.integrationId) params.append('integrationId', options.integrationId)
    return this.request(`/stock/integrations?${params}`)
  }

  async createStockIntegration(data: {
    name: string
    type: string
    config: any
  }) {
    return this.request('/stock/integrations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateStockIntegration(integrationId: string, data: {
    name?: string
    type?: string
    config?: any
    isActive?: boolean
  }) {
    return this.request('/stock/integrations', {
      method: 'PUT',
      body: JSON.stringify({ integrationId, ...data }),
    })
  }

  async deleteStockIntegration(integrationId: string) {
    return this.request(`/stock/integrations?integrationId=${integrationId}`, {
      method: 'DELETE',
    })
  }

  async syncIntegration(integrationId: string) {
    return this.request(`/stock/integrations?type=sync&integrationId=${integrationId}`)
  }

  // Representant Authors API
  async getRepresentantAuthors(filters?: {
    status?: string
    disciplineId?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.disciplineId) params.append('disciplineId', filters.disciplineId)

    const queryString = params.toString()
    return this.request(`/representant/authors${queryString ? `?${queryString}` : ''}`)
  }

  async createRepresentantAuthor(data: {
    name: string
    email: string
    phone?: string
    disciplineId?: string
    password: string
  }) {
    return this.request('/representant/authors', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async validateRepresentantAuthor(authorId: string, status: 'ACTIVE' | 'INACTIVE', reason?: string) {
    return this.request(`/representant/authors/${authorId}/validate`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    })
  }

  // Representant Works API
  async getRepresentantWorks(filters?: {
    status?: string
    disciplineId?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.disciplineId) params.append('disciplineId', filters.disciplineId)

    const queryString = params.toString()
    return this.request(`/representant/works${queryString ? `?${queryString}` : ''}`)
  }

  async transmitWorkToPDG(workId: string, notes?: string) {
    return this.request(`/representant/works/${workId}/transmit`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    })
  }

  async requestWorkCorrection(workId: string, notes: string) {
    return this.request(`/representant/works/${workId}/correction`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    })
  }

  // Representant Messages API
  async getRepresentantConversations() {
    return this.request('/representant/messages')
  }

  async getRepresentantMessages(conversationId: string) {
    return this.request(`/representant/messages?conversationId=${conversationId}`)
  }

  async getRepresentantRecipients() {
    return this.request('/representant/recipients')
  }

  async sendRepresentantMessage(data: {
    recipientId: string
    subject: string
    content: string
    priority?: 'LOW' | 'NORMAL' | 'HIGH'
    type?: 'INTERNAL' | 'WORK_REVIEW' | 'ORDER_UPDATE' | 'GENERAL'
    conversationId?: string
  }) {
    return this.request('/representant/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Representant Reports API
  async getRepresentantReport(startDate: string, endDate: string) {
    return this.request(`/representant/reports?startDate=${startDate}&endDate=${endDate}`)
  }

  async exportRepresentantReport(startDate: string, endDate: string) {
    return this.request(`/representant/reports/export?startDate=${startDate}&endDate=${endDate}`)
  }


  // Concepteur - Œuvres
  async getConcepteurWorks(filters?: { status?: string; disciplineId?: string }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.disciplineId) params.append('disciplineId', filters.disciplineId)
    return this.request(`/concepteur/works?${params}`)
  }

  async updateConcepteurWork(workId: string, data: any) {
    return this.request('/concepteur/works', {
      method: 'PUT',
      body: JSON.stringify({ workId, ...data })
    })
  }

  async deleteConcepteurWork(workId: string) {
    return this.request(`/concepteur/works?id=${workId}`, {
      method: 'DELETE'
    })
  }

  // Représentant - Partenaires
  async getRepresentantPartners(filters?: { status?: string; type?: string; search?: string }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.search) params.append('search', filters.search)
    return this.request(`/representant/partners?${params}`)
  }

  async createRepresentantPartner(data: {
    name: string;
    type: string;
    contact: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    description?: string;
    userData: { name: string; email: string; phone?: string; password: string }
  }) {
    return this.request('/representant/partners', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Représentant - Commandes des partenaires
  async getRepresentantPartnerOrders(filters?: { status?: string; partnerId?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.partnerId) params.append('partnerId', filters.partnerId)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    return this.request(`/representant/partner-orders?${params}`)
  }

  // Partenaire - Dashboard
  async getPartenaireStats() {
    return this.request('/partenaire/dashboard')
  }

  // Partenaire - Stock
  async getPartenaireStock(filters?: { search?: string; discipline?: string; status?: string }) {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.discipline) params.append('discipline', filters.discipline)
    if (filters?.status) params.append('status', filters.status)
    return this.request(`/partenaire/stock?${params}`)
  }

  // Partenaire - Stock alloué
  async getPartenaireStockAllocation(filters?: { search?: string; discipline?: string }) {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.discipline) params.append('discipline', filters.discipline)
    return this.request(`/partenaire/stock-allocation?${params}`)
  }

  // Partenaire - Commandes
  async getPartenaireOrders(filters?: { status?: string; search?: string }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.search) params.append('search', filters.search)
    return this.request(`/partenaire/orders?${params}`)
  }

  async createPartenaireOrder(data: { items: Array<{ workId: string; quantity: number; price?: number }>; notes?: string }) {
    return this.request('/partenaire/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Partenaire - Ventes
  async getPartenaireSales(filters?: { status?: string; type?: string; method?: string; search?: string }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.method) params.append('method', filters.method)
    if (filters?.search) params.append('search', filters.search)
    return this.request(`/partenaire/sales?${params}`)
  }

  // Partenaire - Enregistrer une vente
  async registerPartenaireSale(data: { workId: string; quantity: number; clientName?: string; clientPhone?: string; notes?: string }) {
    return this.request('/partenaire/sales/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Partenaire - Enregistrer un retour
  async registerPartenaireReturn(data: { workId: string; quantity: number; reason?: string; notes?: string }) {
    return this.request('/partenaire/returns/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Partenaire - Catalogue
  async getPartenaireCatalogue(filters?: { search?: string; discipline?: string; price?: string }) {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.discipline) params.append('discipline', filters.discipline)
    if (filters?.price) params.append('price', filters.price)
    return this.request(`/partenaire/catalogue?${params}`)
  }

  // Partenaire - Rapports
  async getPartenaireReports(filters?: { startDate?: string; endDate?: string; type?: string }) {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.type) params.append('type', filters.type)
    return this.request(`/partenaire/reports?${params}`)
  }

  // PDG - Gestion des œuvres
  async getPDGWorks(filters?: { search?: string; discipline?: string; status?: string; lowStock?: boolean }) {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.discipline) params.append('discipline', filters.discipline)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.lowStock) params.append('lowStock', 'true')
    return this.request(`/pdg/stock/works?${params}`)
  }

  async createOrUpdatePDGWork(data: any) {
    return this.request('/pdg/stock/works', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PDG - Mouvements de stock
  async getPDGStockMovements(filters?: { workId?: string; type?: string; startDate?: string; endDate?: string; partnerId?: string }) {
    const params = new URLSearchParams()
    if (filters?.workId) params.append('workId', filters.workId)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.partnerId) params.append('partnerId', filters.partnerId)
    return this.request(`/pdg/stock/movements?${params}`)
  }

  async createPDGStockMovement(data: any) {
    return this.request('/pdg/stock/movements', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PDG - Corrections de stock
  async createPDGStockCorrection(data: any) {
    return this.request('/pdg/stock/corrections', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PDG - Inventaire
  async getPDGInventory(filters?: { discipline?: string; lowStock?: boolean }) {
    const params = new URLSearchParams()
    if (filters?.discipline) params.append('discipline', filters.discipline)
    if (filters?.lowStock) params.append('lowStock', 'true')
    return this.request(`/pdg/stock/inventory?${params}`)
  }

  async applyPDGInventoryAdjustments(data: any) {
    return this.request('/pdg/stock/inventory', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PDG - Allocation de stock partenaire
  async allocatePartnerStock(data: any) {
    return this.request('/pdg/partner-stock/allocate', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PDG - Workflow de stock
  async executeStockOperation(data: any) {
    return this.request('/pdg/stock/workflow', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateStockMovement(movementId: string, data: any) {
    return this.request('/pdg/stock/movements', {
      method: 'PUT',
      body: JSON.stringify({ movementId, ...data })
    })
  }

  async deleteStockMovement(movementId: string) {
    return this.request(`/pdg/stock/movements?id=${movementId}`, {
      method: 'DELETE'
    })
  }

  async getStockMovement(movementId: string) {
    return this.request(`/pdg/stock/movements/${movementId}`)
  }

  async getStockWorkflowStats(filters?: { startDate?: string; endDate?: string }) {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    return this.request(`/pdg/stock/workflow/stats?${params}`)
  }

  // Notifications - Auteur
  async getAuthorNotifications(filters?: { category?: string; limit?: number }) {
    const params = new URLSearchParams()
    if (filters?.category) params.append('category', filters.category)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    return this.request(`/author/notifications?${params}`)
  }

  async markAuthorNotificationAsRead(notificationId: string) {
    return this.request('/author/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ notificationId })
    })
  }

  // Notifications - Concepteur
  async getConcepteurNotifications() {
    return this.request('/concepteur/notifications')
  }

  // Notifications - Partenaire
  async getPartenaireNotifications() {
    return this.request('/partenaire/notifications')
  }

  async markPartenaireNotificationsAsRead(notificationIds: string[]) {
    return this.request('/partenaire/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ notificationIds })
    })
  }

  // Notifications - Représentant
  async getRepresentantNotifications() {
    return this.request('/representant/notifications')
  }

  async markRepresentantNotificationAsRead(notificationId?: string, notificationIds?: string[]) {
    return this.request('/representant/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ notificationId, notificationIds, action: 'read' })
    })
  }

  // Proformas - PDG
  async getPDGProformas(params?: { status?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const query = queryParams.toString()
    return this.request(`/pdg/proforma${query ? `?${query}` : ''}`)
  }

  async createProforma(data: {
    clientType: 'ECOLE' | 'PARTENAIRE' | 'CLIENT' | 'INVITE'
    partnerId?: string // Pour PARTENAIRE
    userId?: string // Pour CLIENT ou ECOLE
    clientName?: string // Pour INVITE
    clientEmail?: string // Pour INVITE
    clientPhone?: string // Pour INVITE
    clientAddress?: string // Pour INVITE
    clientCity?: string // Pour INVITE
    clientCountry?: string // Pour INVITE
    country: string
    currency: 'XOF' | 'XAF' | 'FCFA'
    validUntil: string
    items: Array<{
      workId?: string // L'API attend workId
      bookId?: string // Pour compatibilité
      quantity: number
      unitPriceHT?: number
      discountRate?: number
      tvaRate?: number
      title?: string
      isbn?: string
    }>
    promoCode?: string
    promoDiscountRate?: number
    orderType?: string
    notes?: string
    initialStatus?: 'DRAFT' | 'SENT' // Statut initial (DRAFT par défaut, SENT si "Enregistrer & Envoyer")
  }) {
    return this.request('/pdg/proforma', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateProforma(proformaId: string, data: {
    action?: 'send' | 'accept' | 'expire' | 'cancel' | 'convert'
    status?: string
    cancellationReason?: string
    items?: Array<{ bookId: string; quantity: number; unitPriceHT?: number; discountRate?: number; tvaRate?: number }>
    notes?: string
  }) {
    return this.request(`/pdg/proforma`, {
      method: 'PUT',
      body: JSON.stringify({ id: proformaId, ...data })
    })
  }

  async deleteProforma(proformaId: string) {
    return this.request(`/pdg/proforma`, {
      method: 'DELETE',
      body: JSON.stringify({ id: proformaId })
    })
  }

  // Download file helper
  downloadFile(data: Blob, filename: string) {
    const url = window.URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }
}

export const apiClient = new ApiClient()
