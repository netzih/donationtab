import {
  useStripeTerminal,
  Reader,
  requestNeededAndroidPermissions,
} from '@stripe/stripe-react-native';
import type {PaymentIntent} from '../types';

export class StripeTerminalService {
  private static instance: StripeTerminalService;

  private constructor() {}

  static getInstance(): StripeTerminalService {
    if (!StripeTerminalService.instance) {
      StripeTerminalService.instance = new StripeTerminalService();
    }
    return StripeTerminalService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const granted = await requestNeededAndroidPermissions({
        accessFineLocation: {
          title: 'Location Permission',
          message: 'Stripe Terminal needs access to your location',
          buttonPositive: 'Accept',
        },
      });
      return granted;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async discoverReaders(
    discoverReaders: any,
    simulated: boolean = false,
  ): Promise<Reader.Type[]> {
    try {
      const {error, readers} = await discoverReaders({
        discoveryMethod: 'bluetoothScan',
        simulated,
      });

      if (error) {
        console.error('Reader discovery error:', error);
        return [];
      }

      return readers || [];
    } catch (error) {
      console.error('Failed to discover readers:', error);
      return [];
    }
  }

  async connectToReader(
    connectBluetoothReader: any,
    reader: Reader.Type,
  ): Promise<boolean> {
    try {
      const {error} = await connectBluetoothReader({
        reader,
        locationId: 'tml_simulated', // TODO: Use actual location ID from config
      });

      if (error) {
        console.error('Reader connection error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to connect to reader:', error);
      return false;
    }
  }

  async collectPayment(
    amount: number,
    currency: string = 'usd',
  ): Promise<PaymentIntent | null> {
    // This will be implemented with actual Stripe Terminal hooks in the component
    // For now, returning null as placeholder
    return null;
  }
}

export const stripeTerminalService = StripeTerminalService.getInstance();
