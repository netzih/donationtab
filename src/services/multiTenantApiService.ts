import axios from 'axios';
import type {DonorInfo, Donation} from '../types';

const API_URL = process.env.API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  address?: string;
  taxId?: string;
  logoUrl?: string;
  stripePublishableKey?: string;
  stripeLocationId?: string;
  emailTemplate?: string;
  allowCustomAmount: boolean;
  donationAmounts: Array<{
    id: string;
    amount: number;
    label: string;
  }>;
}

export interface RegisterOrganizationData {
  name: string;
  email: string;
  password: string;
  address?: string;
  taxId?: string;
}

export const multiTenantApiService = {
  // Get list of all organizations
  async getOrganizations(): Promise<Array<{id: string; name: string; slug: string; logoUrl?: string}>> {
    try {
      const response = await api.get('/organizations/list');
      return response.data;
    } catch (error) {
      console.error('Failed to get organizations:', error);
      throw error;
    }
  },

  // Get organization details by slug
  async getOrganizationBySlug(slug: string): Promise<Organization> {
    try {
      const response = await api.get(`/organizations/slug/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get organization:', error);
      throw error;
    }
  },

  // Register new organization
  async registerOrganization(data: RegisterOrganizationData): Promise<{
    success: boolean;
    organization: {id: string; name: string; slug: string};
    message: string;
    setupUrl: string;
  }> {
    try {
      const response = await api.post('/organizations/register', data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to register organization:', error);
      throw new Error(error.response?.data?.error || 'Failed to register organization');
    }
  },

  // Stripe Terminal Connection Token (organization-specific)
  async getConnectionToken(orgId: string): Promise<string> {
    try {
      const response = await api.post(`/stripe/connection-token/${orgId}`);
      return response.data.secret;
    } catch (error) {
      console.error('Failed to get connection token:', error);
      throw error;
    }
  },

  // Create Payment Intent (organization-specific)
  async createPaymentIntent(orgId: string, amount: number, currency: string = 'usd'): Promise<string> {
    try {
      const response = await api.post(`/stripe/payment-intent/${orgId}`, {
        amount,
        currency,
      });
      return response.data.clientSecret;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw error;
    }
  },

  // Save Donation (organization-specific)
  async saveDonation(orgId: string, donation: Omit<Donation, 'id' | 'timestamp'>): Promise<Donation> {
    try {
      const response = await api.post(`/donations/${orgId}`, donation);
      return response.data;
    } catch (error) {
      console.error('Failed to save donation:', error);
      throw error;
    }
  },

  // Send Receipt
  async sendReceipt(
    donationId: string,
    donorInfo: DonorInfo,
    amount: number,
  ): Promise<void> {
    try {
      await api.post('/receipts/send', {
        donationId,
        donorInfo,
        amount,
      });
    } catch (error) {
      console.error('Failed to send receipt:', error);
      throw error;
    }
  },

  // Get Donations (organization-specific, Admin)
  async getDonations(orgId: string, limit: number = 100): Promise<Donation[]> {
    try {
      const response = await api.get(`/donations/${orgId}`, {params: {limit}});
      return response.data;
    } catch (error) {
      console.error('Failed to get donations:', error);
      throw error;
    }
  },

  // Organization Admin Login
  async adminLogin(orgSlug: string, password: string): Promise<{
    token: string;
    expiresIn: number;
    organization: {id: string; name: string; slug: string};
  }> {
    try {
      const response = await api.post(`/admin/login/${orgSlug}`, {password});
      return response.data;
    } catch (error: any) {
      console.error('Admin login failed:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  // Update Organization (requires auth token)
  async updateOrganization(
    orgId: string,
    updates: Partial<Organization>,
    token: string,
  ): Promise<void> {
    try {
      await api.patch(`/organizations/${orgId}`, updates, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Failed to update organization:', error);
      throw error;
    }
  },

  // Get Organization Statistics
  async getOrganizationStats(orgId: string): Promise<{
    total_donations: number;
    total_amount: number;
    average_amount: number;
    receipts_sent: number;
  }> {
    try {
      const response = await api.get(`/organizations/${orgId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  },
};
