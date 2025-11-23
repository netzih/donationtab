import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Dimensions, ActivityIndicator} from 'react-native';
import {Text, Button, Card, IconButton} from 'react-native-paper';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '../App';
import {
  useStripeTerminal,
  Reader,
} from '@stripe/stripe-react-native';
import {apiService} from '../services/apiService';
import {stripeTerminalService} from '../services/stripeService';

type PaymentScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Payment'>;
  route: RouteProp<RootStackParamList, 'Payment'>;
};

const {width} = Dimensions.get('window');
const isTablet = width >= 768;

const PaymentScreen: React.FC<PaymentScreenProps> = ({navigation, route}) => {
  const {amount} = route.params;
  const [status, setStatus] = useState<'initializing' | 'ready' | 'processing' | 'success' | 'error'>('initializing');
  const [message, setMessage] = useState('Connecting to card reader...');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [readers, setReaders] = useState<Reader.Type[]>([]);

  const {
    discoverReaders,
    connectBluetoothReader,
    createPaymentIntent,
    collectPaymentMethod,
    confirmPaymentIntent,
    cancelCollectPaymentMethod,
  } = useStripeTerminal({
    onUpdateDiscoveredReaders: (discoveredReaders) => {
      setReaders(discoveredReaders);
    },
  });

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      // Request permissions
      const hasPermissions = await stripeTerminalService.requestPermissions();
      if (!hasPermissions) {
        setStatus('error');
        setMessage('Location permissions are required for card reader');
        return;
      }

      // Discover readers
      setMessage('Searching for card readers...');
      const discoveredReaders = await stripeTerminalService.discoverReaders(
        discoverReaders,
        true, // Set to false in production
      );

      if (discoveredReaders.length === 0) {
        setStatus('error');
        setMessage('No card readers found. Please ensure your reader is powered on and nearby.');
        return;
      }

      // Connect to first available reader
      setMessage('Connecting to card reader...');
      const connected = await stripeTerminalService.connectToReader(
        connectBluetoothReader,
        discoveredReaders[0],
      );

      if (!connected) {
        setStatus('error');
        setMessage('Failed to connect to card reader');
        return;
      }

      // Create payment intent
      setMessage('Preparing payment...');
      const {paymentIntent, error: piError} = await createPaymentIntent({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        paymentMethodTypes: ['card_present'],
      });

      if (piError) {
        setStatus('error');
        setMessage(`Payment setup failed: ${piError.message}`);
        return;
      }

      if (paymentIntent) {
        setPaymentIntentId(paymentIntent.id);
        setStatus('ready');
        setMessage('Please tap or insert your card');

        // Start collecting payment
        await handleCollectPayment(paymentIntent.id);
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      setStatus('error');
      setMessage(`Error: ${error.message || 'Unknown error occurred'}`);
    }
  };

  const handleCollectPayment = async (intentId: string) => {
    try {
      setStatus('processing');
      setMessage('Waiting for card...');

      const {paymentIntent, error: collectError} = await collectPaymentMethod({
        paymentIntentId: intentId,
      });

      if (collectError) {
        setStatus('error');
        setMessage(`Payment collection failed: ${collectError.message}`);
        return;
      }

      setMessage('Processing payment...');

      const {paymentIntent: confirmedIntent, error: confirmError} =
        await confirmPaymentIntent({
          paymentIntentId: intentId,
        });

      if (confirmError) {
        setStatus('error');
        setMessage(`Payment confirmation failed: ${confirmError.message}`);
        return;
      }

      if (confirmedIntent?.status === 'succeeded') {
        setStatus('success');
        setMessage('Payment successful!');

        // Save donation to backend
        try {
          const donation = await apiService.saveDonation({
            amount,
            currency: 'usd',
            stripePaymentIntentId: confirmedIntent.id,
            status: 'completed',
            receiptSent: false,
          });

          // Navigate to receipt info screen after short delay
          setTimeout(() => {
            navigation.replace('ReceiptInfo', {
              donationId: donation.id,
              amount,
            });
          }, 1500);
        } catch (error) {
          console.error('Failed to save donation:', error);
          // Still proceed to receipt screen even if save fails
          setTimeout(() => {
            navigation.replace('ReceiptInfo', {
              donationId: 'temp_' + Date.now(),
              amount,
            });
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error('Payment collection error:', error);
      setStatus('error');
      setMessage(`Error: ${error.message || 'Unknown error occurred'}`);
    }
  };

  const handleCancel = async () => {
    try {
      if (status === 'processing') {
        await cancelCollectPaymentMethod();
      }
      navigation.goBack();
    } catch (error) {
      console.error('Cancel error:', error);
      navigation.goBack();
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'initializing':
      case 'processing':
        return null;
      case 'ready':
        return 'credit-card-outline';
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      default:
        return '#6366f1';
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {/* Amount Display */}
          <Text variant="displaySmall" style={styles.amount}>
            ${amount.toFixed(2)}
          </Text>

          {/* Status Icon/Loader */}
          <View style={styles.statusContainer}>
            {(status === 'initializing' || status === 'processing') ? (
              <ActivityIndicator size={isTablet ? 80 : 60} color="#6366f1" />
            ) : (
              <IconButton
                icon={getStatusIcon() || 'credit-card'}
                size={isTablet ? 80 : 60}
                iconColor={getStatusColor()}
              />
            )}
          </View>

          {/* Status Message */}
          <Text
            variant="headlineSmall"
            style={[styles.message, {color: getStatusColor()}]}>
            {message}
          </Text>

          {/* Reader Info */}
          {readers.length > 0 && status !== 'error' && (
            <Text variant="bodyMedium" style={styles.readerInfo}>
              Reader: {readers[0].label || readers[0].serialNumber}
            </Text>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {status === 'error' && (
              <Button
                mode="contained"
                onPress={initializePayment}
                style={styles.button}
                contentStyle={styles.buttonContent}>
                Try Again
              </Button>
            )}
            {status !== 'success' && (
              <Button
                mode="outlined"
                onPress={handleCancel}
                style={styles.button}
                contentStyle={styles.buttonContent}>
                Cancel
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isTablet ? 40 : 20,
  },
  card: {
    width: '100%',
    maxWidth: isTablet ? 600 : '100%',
    borderRadius: 20,
    elevation: 4,
  },
  cardContent: {
    padding: isTablet ? 50 : 30,
    alignItems: 'center',
  },
  amount: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 40,
  },
  statusContainer: {
    marginVertical: 40,
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  readerInfo: {
    color: '#666',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: isTablet ? 12 : 8,
  },
});

export default PaymentScreen;
