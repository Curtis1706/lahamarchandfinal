/**
 * Type definitions for API responses and requests
 * Provides type safety for all API client calls
 */

// ============================================
// USER TYPES
// ============================================

export interface User {
    id: string
    name: string
    email: string
    role: string
    phone?: string
    disciplineId?: string | null
    status?: string
    createdAt?: string
    updatedAt?: string
    lastLoginAt?: string

    // Nouveaux champs de profil
    image?: string | null
    address?: string | null
    bio?: string | null
    website?: string | null
    linkedin?: string | null
    twitter?: string | null

    // Champs institutionnels
    ifu?: string | null
    establishment?: string | null
    director?: string | null
    department?: string | null
    founded?: string | null

    // Champs bancaires
    bankName?: string | null
    accountNumber?: string | null
    accountName?: string | null
    iban?: string | null
    swiftCode?: string | null
    mobileMoneyProvider?: string | null
    mobileMoneyNumber?: string | null
}

export interface UsersResponse {
    users: User[]
    total?: number
}

export interface CreateUserRequest {
    name: string
    email: string
    phone?: string
    role: string
    disciplineId?: string | null
    password?: string
    otpCode?: string
}

export interface UpdateUserRequest {
    id: string
    name?: string
    email?: string
    phone?: string
    role?: string
    disciplineId?: string | null
    status?: string

    // Nouveaux champs de profil
    image?: string | null
    address?: string | null
    bio?: string | null
    website?: string | null
    linkedin?: string | null
    twitter?: string | null

    // Champs institutionnels
    ifu?: string | null
    establishment?: string | null
    director?: string | null
    department?: string | null
    founded?: string | null

    // Champs bancaires
    bankName?: string | null
    accountNumber?: string | null
    accountName?: string | null
    iban?: string | null
    swiftCode?: string | null
    mobileMoneyProvider?: string | null
    mobileMoneyNumber?: string | null
}

// ============================================
// ORDER TYPES
// ============================================

export interface OrderItem {
    id: string
    workId: string
    quantity: number
    price: number
    work?: Work
}

export interface Order {
    id: string
    userId: string
    partnerId?: string | null
    status: string
    total: number
    paymentReference?: string | null
    promoCode?: string | null
    discountAmount?: number
    items: OrderItem[]
    createdAt: string
    updatedAt?: string
    user?: User
    partner?: Partner
}

export interface OrdersResponse {
    orders: Order[]
    total?: number
}

export interface CreateOrderRequest {
    userId: string
    items: Array<{ workId: string; quantity: number; price: number }>
    promoCode?: string | null
    discountAmount?: number
}

export interface UpdateOrderRequest {
    status: string
    cancellationReason?: string
}

// ============================================
// WORK TYPES
// ============================================

export interface Work {
    id: string
    title: string
    isbn?: string
    price: number
    stock?: number
    status?: string
    disciplineId?: string
    authorId?: string
    concepteurId?: string
    projectId?: string | null
    discipline?: Discipline
    author?: User
    concepteur?: User
}

export interface WorksResponse {
    works: Work[]
    total?: number
}

export interface WorkStatsResponse {
    totalWorks: number
    publishedWorks: number
    draftWorks: number
    pendingWorks: number
}

// ============================================
// PROJECT TYPES
// ============================================

export interface Project {
    id: string
    title: string
    description?: string
    status: string
    disciplineId: string
    concepteurId: string
    reviewerId?: string | null
    createdAt: string
    updatedAt?: string
    reviewedAt?: string | null
    discipline?: Discipline
    concepteur?: User
}

export interface ProjectsResponse {
    projects: Project[]
    total?: number
}

export interface CreateProjectRequest {
    title: string
    disciplineId: string
    concepteurId: string
    description?: string
    status?: string
}

export interface UpdateProjectRequest {
    title?: string
    description?: string
    status?: string
    disciplineId?: string
}

// ============================================
// DISCIPLINE TYPES
// ============================================

export interface Discipline {
    id: string
    name: string
    description?: string
    createdAt?: string
}

export interface DisciplinesResponse {
    disciplines: Discipline[]
}

// ============================================
// PARTNER TYPES
// ============================================

export interface Partner {
    id: string
    name: string
    type: string
    email?: string
    phone?: string
    address?: string
    status?: string
    userId?: string
}

export interface PartnersResponse {
    partners: Partner[]
    total?: number
}

// ============================================
// STOCK TYPES
// ============================================

export interface StockMovement {
    id: string
    workId: string
    type: string
    quantity: number
    reason?: string
    reference?: string
    performedBy?: string
    createdAt: string
    work?: Work
}

export interface StockAlert {
    id: string
    workId: string
    type: string
    threshold: number
    currentStock: number
    resolved: boolean
    work?: Work
}

export interface StockStats {
    totalWorks: number
    totalStock: number
    lowStock: number
    outOfStock: number
    pendingOperations: number
}

export interface StockMovementsResponse {
    movements: StockMovement[]
    total?: number
}

export interface StockAlertsResponse {
    alerts: StockAlert[]
    total?: number
}

export interface CreateStockMovementRequest {
    workId: string
    type: string
    quantity: number
    reason?: string
    reference?: string
    performedBy?: string
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
    id: string
    userId: string
    title: string
    message: string
    type: string
    read: boolean
    data?: string | null
    createdAt: string
}

export interface NotificationsResponse {
    notifications: Notification[]
    unreadCount: number
    total: number
}

// ============================================
// MESSAGE TYPES
// ============================================

export interface Message {
    id: string
    senderId: string
    receiverId: string
    content: string
    read: boolean
    createdAt: string
    sender?: User
    receiver?: User
}

export interface MessagesResponse {
    messages: Message[]
    total?: number
}

// ============================================
// PROMO CODE TYPES
// ============================================

export interface PromoCode {
    id: string
    code: string
    type: string
    value: number
    minAmount?: number
    maxUses?: number
    usedCount: number
    validFrom: string
    validUntil: string
    active: boolean
}

export interface PromoCodesResponse {
    promoCodes: PromoCode[]
    total?: number
}

// ============================================
// COMMON RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page?: number
    limit?: number
}

// ============================================
// WITHDRAWAL TYPES
// ============================================

export interface WithdrawalInput {
    amount: number
    authorId: string
    description?: string
    bankDetails?: {
        accountNumber: string
        bankName: string
        accountHolder: string
    }
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface SettingsInput {
    [key: string]: string | number | boolean | null | undefined
}

// ============================================
// NOTIFICATION CHAIN TYPES
// ============================================

export interface NotificationConditions {
    event: string
    filters?: Record<string, unknown>
    roles?: string[]
}

export interface NotificationActions {
    type: 'EMAIL' | 'SMS' | 'IN_APP'
    recipients: string[]
    template?: string
    data?: Record<string, unknown>
}

// ============================================
// NOTIFICATION TEMPLATE TYPES
// ============================================

export interface NotificationTemplateParameters {
    [key: string]: string | number | boolean | null | undefined
}

// ============================================
// INTEGRATION TYPES
// ============================================

export interface IntegrationConfig {
    [key: string]: string | number | boolean | null | undefined
}

// ============================================
// WORK UPDATE TYPES
// ============================================

export interface WorkUpdateInput {
    title?: string
    description?: string
    price?: number
    stock?: number
    status?: string
    isbn?: string
    category?: string
    targetAudience?: string
    [key: string]: unknown
}

// ============================================
// STOCK OPERATION TYPES
// ============================================

export interface StockMovementInput {
    workId: string
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER'
    quantity: number
    reason?: string
    reference?: string
    partnerId?: string
}

export interface StockCorrectionInput {
    workId: string
    newStock: number
    reason: string
}

export interface InventoryAdjustmentInput {
    adjustments: Array<{
        workId: string
        quantity: number
    }>
    reason: string
}

export interface PartnerStockAllocationInput {
    partnerId: string
    workId: string
    quantity: number
}

export interface StockOperationInput {
    type: 'allocation' | 'return' | 'transfer'
    workId: string
    quantity: number
    partnerId?: string
    sourcePartnerId?: string
    targetPartnerId?: string
    reason?: string
}
