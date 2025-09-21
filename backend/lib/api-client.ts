import { Role } from "@prisma/client"

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || "An error occurred" }
      }

      return { data }
    } catch (error) {
      return { error: "Network error" }
    }
  }

  // Users API
  async getUsers() {
    return this.request("/users")
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`)
  }

  async createUser(userData: {
    name: string
    email: string
    password: string
    role: Role
  }) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async updateUser(id: string, userData: {
    name: string
    email: string
    password?: string
    role: Role
  }) {
    return this.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: "DELETE",
    })
  }

  // Works API
  async getWorks() {
    return this.request("/works")
  }

  async getWork(id: string) {
    return this.request(`/works/${id}`)
  }

  async createWork(workData: {
    title: string
    isbn?: string
    price: number
    disciplineId: string
    authorId?: string
    concepteurId?: string
  }) {
    return this.request("/works", {
      method: "POST",
      body: JSON.stringify(workData),
    })
  }

  async updateWork(id: string, workData: {
    title: string
    isbn?: string
    price: number
    disciplineId: string
    authorId?: string
    status?: string
  }) {
    return this.request(`/works/${id}`, {
      method: "PUT",
      body: JSON.stringify(workData),
    })
  }

  async deleteWork(id: string) {
    return this.request(`/works/${id}`, {
      method: "DELETE",
    })
  }

  async updateWorkStatus(id: string, status: string) {
    return this.request(`/works/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
  }

  // Orders API
  async getOrders() {
    return this.request("/orders")
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`)
  }

  async createOrder(orderData: {
    userId: string
    items: Array<{
      workId: string
      quantity: number
      price?: number
    }>
  }) {
    return this.request("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    })
  }

  async updateOrder(id: string, orderData: {
    status?: string
    items?: Array<{
      workId: string
      quantity: number
      price: number
    }>
  }) {
    return this.request(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(orderData),
    })
  }

  async deleteOrder(id: string) {
    return this.request(`/orders/${id}`, {
      method: "DELETE",
    })
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/pdg/orders`, {
      method: "POST",
      body: JSON.stringify({ orderId: id, status }),
    })
  }

  // Disciplines API
  async getDisciplines() {
    return this.request("/disciplines")
  }

  async createDiscipline(disciplineData: { name: string }) {
    return this.request("/disciplines", {
      method: "POST",
      body: JSON.stringify(disciplineData),
    })
  }
}

export const apiClient = new ApiClient()
