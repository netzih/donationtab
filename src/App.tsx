import React, {useEffect, useState} from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Provider as PaperProvider, MD3LightTheme} from 'react-native-paper';
import {StripeTerminalProvider} from '@stripe/stripe-react-native';

// Screens
import DonorHomeScreen from './screens/DonorHomeScreen';
import PaymentScreen from './screens/PaymentScreen';
import ReceiptInfoScreen from './screens/ReceiptInfoScreen';
import ThankYouScreen from './screens/ThankYouScreen';
import AdminLoginScreen from './screens/AdminLoginScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';

// Services
import {loadConfig} from './services/configService';
import type {AppConfig} from './types';

export type RootStackParamList = {
  DonorHome: undefined;
  Payment: {amount: number};
  ReceiptInfo: {donationId: string; amount: number};
  ThankYou: undefined;
  AdminLogin: undefined;
  AdminDashboard: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6366f1',
    secondary: '#8b5cf6',
  },
};

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppConfig();
  }, []);

  const loadAppConfig = async () => {
    try {
      const appConfig = await loadConfig();
      setConfig(appConfig);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !config) {
    return null; // TODO: Add loading screen
  }

  return (
    <PaperProvider theme={theme}>
      <StripeTerminalProvider
        logLevel="verbose"
        tokenProvider={async () => {
          // TODO: Implement token provider that calls your backend
          const response = await fetch('YOUR_BACKEND_URL/stripe-terminal-token');
          const {secret} = await response.json();
          return secret;
        }}>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" />
          <Stack.Navigator
            initialRouteName="DonorHome"
            screenOptions={{
              headerShown: false,
            }}>
            <Stack.Screen name="DonorHome" component={DonorHomeScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="ReceiptInfo" component={ReceiptInfoScreen} />
            <Stack.Screen name="ThankYou" component={ThankYouScreen} />
            <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </StripeTerminalProvider>
    </PaperProvider>
  );
};

export default App;
