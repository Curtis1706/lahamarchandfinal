
const BASE_URL = process.env.MONEROO_API_URL || "https://api.moneroo.io/v1";

interface MonerooConfig {
    apiKey: string;
    secretKey: string;
    mode: 'sandbox' | 'production';
}

export class MonerooClient {
    private config: MonerooConfig;

    constructor(config: MonerooConfig) {
        this.config = config;
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.config.secretKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
        };

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(`Moneroo API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
        }

        return response.json();
    }

    public payments = {
        initialize: async (data: any) => {
            return this.request('/payments/initialize', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        get: async (id: string) => {
            return this.request(`/payments/${id}`, {
                method: 'GET',
            });
        },
        // Implement other methods as needed based on hypothetical SDK usage
        create: async (data: any) => { // Alias for initialize if needed
            return this.payments.initialize(data);
        }
    };

    public payouts = {
        create: async (data: any) => {
            return this.request('/payouts/create', { // Endpoint hypothesis
                method: 'POST',
                body: JSON.stringify(data),
            });
        }
    };
}

export const monerooClient = new MonerooClient({
    apiKey: process.env.MONEROO_API_KEY || '',
    secretKey: process.env.MONEROO_SECRET_KEY || '',
    mode: (process.env.MONEROO_MODE as 'sandbox' | 'production') || 'sandbox',
});

export const isMonerooConfigured = () => {
    return !!(process.env.MONEROO_API_KEY && process.env.MONEROO_SECRET_KEY);
};
