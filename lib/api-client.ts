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

  // Works API
  async getWorks() {
    return this.request('/works')
  }

  async createWork(workData: any) {
    return this.request('/works', {
      method: 'POST',
      body: JSON.stringify(workData),
    })
  }

  // Orders API
  async getOrders() {
    return this.request('/orders')
  }

  async createOrder(orderData: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  }

  // Disciplines API
  async getDisciplines() {
    return this.request('/disciplines')
  }
}

export const apiClient = new ApiClient()
