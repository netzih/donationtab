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

export const apiService = {
  // Stripe Terminal Connection Token
  async getConnectionToken(): Promise<string> {
    try {
      const response = await api.post('/stripe/connection-token');
      return response.data.secret;
    } catch (error) {
      console.error('Failed to get connection token:', error);
      throw error;
    }
  },

  // Create Payment Intent
  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<string> {
    try {
      const response = await api.post('/stripe/payment-intent', {
        amount,
        currency,
      });
      return response.data.clientSecret;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw error;
    }
  },

  // Save Donation
  async saveDonation(donation: Omit<Donation, 'id' | 'timestamp'>): Promise<Donation> {
    try {
      const response = await api.post('/donations', donation);
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

  // Get Donations (Admin)
  async getDonations(limit: number = 100): Promise<Donation[]> {
    try {
      const response = await api.get('/donations', {params: {limit}});
      return response.data;
    } catch (error) {
      console.error('Failed to get donations:', error);
      throw error;
    }
  },

  // Admin Authentication
  async adminLogin(password: string): Promise<{token: string}> {
    try {
      const response = await api.post('/admin/login', {password});
      return response.data;
    } catch (error) {
      console.error('Admin login failed:', error);
      throw error;
    }
  },
};
