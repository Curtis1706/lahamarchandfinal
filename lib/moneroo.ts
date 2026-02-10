/**
 * Service d'intégration Moneroo pour lahamarchand
 * 
 * Ce service gère les paiements, transactions et retraits via l'API Moneroo
 * Documentation: https://api.moneroo.io/v1
 */

// Types pour Moneroo
export interface MonerooConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  baseUrl: string;
}

export interface MonerooPaymentRequest {
  amount: number;
  currency: string; // XOF, XAF, etc.
  description: string;
  customer: {
    email?: string;
    name?: string;
    phone?: string;
  };
  return_url?: string;
  cancel_url?: string;
  callback_url?: string;
  webhook_url?: string;
  metadata?: Record<string, unknown>;
}

export interface MonerooPaymentResponse {
  success: boolean;
  data?: {
    payment_id: string;
    payment_url: string;
    status: "pending" | "processing" | "success" | "failed" | "cancelled";
    amount: number;
    currency: string;
    created_at: string;
  };
  message?: string;
  error?: string;
}

export interface MonerooTransaction {
  transaction_id: string;
  payment_id: string;
  status: "pending" | "processing" | "success" | "failed" | "cancelled" | "expired";
  amount: number;
  currency: string;
  description?: string;
  customer?: {
    email?: string;
    name?: string;
    phone?: string;
  };
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  failure_reason?: string;
  metadata?: Record<string, unknown>;
}

export interface MonerooPayoutRequest {
  amount: number;
  currency: string;
  method: string; // "mobile_money", "bank_transfer", "mtn_bj", etc.
  phone?: string; // Pour Mobile Money
  bank_account?: string; // Pour virement bancaire
  beneficiary_name: string;
  beneficiary_email?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface MonerooPayoutResponse {
  success: boolean;
  data?: {
    payout_id: string;
    status: "pending" | "processing" | "success" | "failed" | "cancelled";
    amount: number;
    currency: string;
    method: string;
    beneficiary_name: string;
    created_at: string;
  };
  message?: string;
  error?: string;
}

export interface MonerooBalance {
  available: number;
  pending: number;
  currency: string;
}

/**
 * Webhook event types
 */
export interface MonerooWebhookEvent {
  event: "payment.success" | "payment.failed" | "payment.cancelled" | "payout.success" | "payout.failed";
  data: {
    transaction_id: string;
    payment_id?: string;
    payout_id?: string;
    status: string;
    amount: number;
    currency: string;
    customer?: {
      email?: string;
      name?: string;
    };
    metadata?: Record<string, unknown>;
  };
  created_at: string;
}

/**
 * Classe principale du service Moneroo
 */
export class MonerooService {
  private config: MonerooConfig;

  constructor(config?: Partial<MonerooConfig>) {
    // Charger la configuration depuis les variables d'environnement
    this.config = {
      publicKey: config?.publicKey || process.env.MONEROO_PUBLIC_KEY || "",
      secretKey: config?.secretKey || process.env.MONEROO_SECRET_KEY || "",
      webhookSecret: config?.webhookSecret || process.env.MONEROO_WEBHOOK_SECRET || "",
      baseUrl: config?.baseUrl || process.env.MONEROO_BASE_URL || "https://api.moneroo.io/v1",
    };

    if (!this.config.publicKey || !this.config.secretKey) {
    }
  }

  /**
   * Générer les en-têtes d'authentification pour les requêtes Moneroo
   */
  private getAuthHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.secretKey}`,
      "Accept": "application/json",
    };
  }

  /**
   * Effectuer une requête HTTP vers l'API Moneroo
   */
  private async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: unknown
  ): Promise<T> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      const headers = this.getAuthHeaders();


      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Moneroo API Error Response:", data);
        throw new Error(data.message || data.error || `Moneroo API error: ${response.status}`);
      }

      return data as T;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("❌ Moneroo API Error:", errorMessage);
      throw error;
    }
  }

  /**
   * Initier un paiement via Moneroo
   */
  async initiatePayment(
    request: MonerooPaymentRequest
  ): Promise<MonerooPaymentResponse> {
    try {

      const response = await this.request<MonerooPaymentResponse>(
        "/payments",
        "POST",
        request
      );

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("❌ Error initiating Moneroo payment:", errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: "Échec de l'initiation du paiement",
      };
    }
  }

  /**
   * Vérifier le statut d'une transaction
   */
  async getTransactionStatus(
    transactionId: string
  ): Promise<MonerooTransaction> {
    try {

      const response = await this.request<{ data: MonerooTransaction }>(
        `/transactions/${transactionId}`,
        "GET"
      );

      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("❌ Error checking transaction status:", errorMessage);
      throw error;
    }
  }

  /**
   * Récupérer les informations d'un paiement
   */
  async getPaymentDetails(paymentId: string): Promise<MonerooTransaction | null> {
    try {

      const response = await this.request<{ data: MonerooTransaction }>(
        `/payments/${paymentId}`,
        "GET"
      );

      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("❌ Error getting payment details:", errorMessage);
      return null;
    }
  }

  /**
   * Initier un retrait (payout)
   */
  async initiatePayout(
    request: MonerooPayoutRequest
  ): Promise<MonerooPayoutResponse> {
    try {

      const response = await this.request<MonerooPayoutResponse>(
        "/payouts",
        "POST",
        request
      );

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("❌ Error initiating Moneroo payout:", errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: "Échec de l'initiation du retrait",
      };
    }
  }

  /**
   * Vérifier le statut d'un retrait
   */
  async getPayoutStatus(payoutId: string): Promise<MonerooPayoutResponse["data"] | null> {
    try {

      const response = await this.request<{ data: MonerooPayoutResponse["data"] }>(
        `/payouts/${payoutId}`,
        "GET"
      );

      return response.data || null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("❌ Error checking payout status:", errorMessage);
      return null;
    }
  }

  /**
   * Obtenir le solde du compte marchand
   */
  async getBalance(): Promise<MonerooBalance> {
    try {

      const response = await this.request<{ data: MonerooBalance }>(
        "/balance",
        "GET"
      );

      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("❌ Error getting balance:", errorMessage);
      throw error;
    }
  }

  /**
   * Lister les transactions
   */
  async listTransactions(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<MonerooTransaction[]> {
    try {

      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.offset) queryParams.append("offset", params.offset.toString());
      if (params?.status) queryParams.append("status", params.status);
      if (params?.start_date) queryParams.append("start_date", params.start_date);
      if (params?.end_date) queryParams.append("end_date", params.end_date);

      const endpoint = `/transactions?${queryParams.toString()}`;
      const response = await this.request<{ data: MonerooTransaction[] }>(
        endpoint,
        "GET"
      );

      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("❌ Error listing transactions:", errorMessage);
      return [];
    }
  }

  /**
   * Webhook handler pour les notifications Moneroo
   * Vérifie la signature du webhook pour sécuriser les notifications
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const crypto = require("crypto");
      const expectedSignature = crypto
        .createHmac("sha256", this.config.webhookSecret)
        .update(payload)
        .digest("hex");

      const isValid = signature === expectedSignature;
      if (!isValid) {
      }
      return isValid;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("❌ Error verifying webhook signature:", errorMessage);
      return false;
    }
  }

  /**
   * Parser un événement webhook Moneroo
   */
  parseWebhookEvent(body: unknown): MonerooWebhookEvent | null {
    try {
      if (!body || typeof body !== 'object' || !('event' in body) || !('data' in body)) {
        console.error("❌ Invalid webhook payload structure");
        return null;
      }

      return body as MonerooWebhookEvent;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("❌ Error parsing webhook event:", errorMessage);
      return null;
    }
  }
}

// Instance singleton du service Moneroo
let monerooInstance: MonerooService | null = null;

/**
 * Obtenir l'instance du service Moneroo
 */
export function getMonerooService(): MonerooService {
  if (!monerooInstance) {
    monerooInstance = new MonerooService();
  }
  return monerooInstance;
}

export default MonerooService;


