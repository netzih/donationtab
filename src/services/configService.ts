import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AppConfig, DonationAmount} from '../types';

const CONFIG_KEY = '@app_config';

const defaultConfig: AppConfig = {
  stripePublishableKey: '',
  stripeSecretKey: '',
  donationAmounts: [
    {id: '1', amount: 10, label: '$10'},
    {id: '2', amount: 25, label: '$25'},
    {id: '3', amount: 50, label: '$50'},
    {id: '4', amount: 100, label: '$100'},
  ],
  allowCustomAmount: true,
  organizationName: 'Your Organization',
  organizationEmail: 'donations@yourorg.com',
  organizationAddress: '123 Main St, City, State 12345',
  organizationTaxId: '',
  emailTemplate: `Dear {name},

Thank you for your generous donation of {amount} to {organization}.

Your donation helps us continue our mission and make a difference.

Tax ID: {taxId}
Donation Date: {date}
Amount: {amount}

This email serves as your receipt for tax purposes.

With gratitude,
{organization} Team`,
};

export const loadConfig = async (): Promise<AppConfig> => {
  try {
    const configJson = await AsyncStorage.getItem(CONFIG_KEY);
    if (configJson) {
      return JSON.parse(configJson);
    }
    return defaultConfig;
  } catch (error) {
    console.error('Error loading config:', error);
    return defaultConfig;
  }
};

export const saveConfig = async (config: AppConfig): Promise<void> => {
  try {
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
};

export const updateDonationAmounts = async (
  amounts: DonationAmount[],
): Promise<void> => {
  const config = await loadConfig();
  config.donationAmounts = amounts;
  await saveConfig(config);
};

export const updateStripeKeys = async (
  publishableKey: string,
  secretKey: string,
): Promise<void> => {
  const config = await loadConfig();
  config.stripePublishableKey = publishableKey;
  config.stripeSecretKey = secretKey;
  await saveConfig(config);
};

export const updateOrganizationInfo = async (
  name: string,
  email: string,
  address: string,
  taxId: string,
): Promise<void> => {
  const config = await loadConfig();
  config.organizationName = name;
  config.organizationEmail = email;
  config.organizationAddress = address;
  config.organizationTaxId = taxId;
  await saveConfig(config);
};

export const updateLogo = async (logoUri: string): Promise<void> => {
  const config = await loadConfig();
  config.logoUri = logoUri;
  await saveConfig(config);
};

export const updateEmailTemplate = async (template: string): Promise<void> => {
  const config = await loadConfig();
  config.emailTemplate = template;
  await saveConfig(config);
};
