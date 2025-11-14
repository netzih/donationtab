export interface DonationAmount {
  id: string;
  amount: number;
  label: string;
}

export interface AppConfig {
  stripePublishableKey: string;
  stripeSecretKey: string;
  donationAmounts: DonationAmount[];
  allowCustomAmount: boolean;
  organizationName: string;
  organizationEmail: string;
  organizationAddress: string;
  organizationTaxId: string;
  logoUri?: string;
  emailTemplate: string;
}

export interface DonorInfo {
  name: string;
  email: string;
  wantsReceipt: boolean;
}

export interface Donation {
  id: string;
  amount: number;
  currency: string;
  donorInfo?: DonorInfo;
  timestamp: Date;
  stripePaymentIntentId: string;
  status: 'pending' | 'completed' | 'failed';
  receiptSent: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface StripeTerminalReader {
  id: string;
  label: string;
  serialNumber: string;
  status: 'online' | 'offline';
}
