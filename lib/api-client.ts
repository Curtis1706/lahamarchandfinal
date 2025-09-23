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

    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Users API
  async getUsers() {
    return this.request('/users')
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async updateUser(userId: string, userData: any) {
    return this.request('/users', {
      method: 'PUT',
      body: JSON.stringify({ id: userId, ...userData }),
    })
  }

  async deleteUser(userId: string) {
    return this.request(`/users?id=${userId}`, {
      method: 'DELETE',
    })
  }

  // Validation API
  async getPendingUsers(status: string = 'PENDING') {
    return this.request(`/users/validate?status=${status}`)
  }

  async validateUser(userId: string, status: 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
    return this.request('/users/validate', {
      method: 'PUT',
      body: JSON.stringify({ userId, status }),
    })
  }

  // Works API
  async getWorks() {
    return this.request('/works')
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

  async createOrder(orderData: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  }

  async updateOrder(orderId: string, orderData: any) {
    return this.request('/orders', {
      method: 'PUT',
      body: JSON.stringify({ id: orderId, ...orderData }),
    })
  }

  async deleteOrder(orderId: string) {
    return this.request(`/orders?id=${orderId}`, {
      method: 'DELETE',
    })
  }

  async createWork(workData: any) {
    return this.request('/works', {
      method: 'POST',
      body: JSON.stringify(workData),
    })
  }

  // Disciplines API
  async getDisciplines() {
    return this.request('/disciplines')
  }

  // Stock Management API
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

  async createStockMovement(data: any) {
    return this.request('/stock', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async validateStockOperation(operationId: string, approved: boolean) {
    return this.request('/stock', {
      method: 'PUT',
      body: JSON.stringify({ operationId, approved }),
    })
  }

  async exportStockReport(type: string) {
    const response = await fetch(`${this.baseUrl}/reports/stock?type=${type}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Export failed')
    }
    
    // Déclencher le téléchargement
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `stock-report-${type}-${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }
}

export const apiClient = new ApiClient()
