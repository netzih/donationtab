import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Dimensions} from 'react-native';
import {Text, Button, Card, TextInput, Checkbox} from 'react-native-paper';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '../App';
import {apiService} from '../services/apiService';
import type {DonorInfo} from '../types';

type ReceiptInfoScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ReceiptInfo'>;
  route: RouteProp<RootStackParamList, 'ReceiptInfo'>;
};

const {width} = Dimensions.get('window');
const isTablet = width >= 768;

const ReceiptInfoScreen: React.FC<ReceiptInfoScreenProps> = ({
  navigation,
  route,
}) => {
  const {donationId, amount} = route.params;
  const [wantsReceipt, setWantsReceipt] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{name?: string; email?: string}>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: {name?: string; email?: string} = {};

    if (wantsReceipt) {
      if (!name.trim()) {
        newErrors.name = 'Name is required';
      }
      if (!email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(email)) {
        newErrors.email = 'Please enter a valid email';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (wantsReceipt && name && email) {
        const donorInfo: DonorInfo = {
          name: name.trim(),
          email: email.trim(),
          wantsReceipt: true,
        };

        await apiService.sendReceipt(donationId, donorInfo, amount);
      }

      navigation.replace('ThankYou');
    } catch (error) {
      console.error('Failed to send receipt:', error);
      // Still proceed to thank you screen even if receipt fails
      navigation.replace('ThankYou');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setWantsReceipt(false);
    navigation.replace('ThankYou');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            {/* Success Message */}
            <Text variant="displaySmall" style={styles.successIcon}>
              ✓
            </Text>
            <Text variant="headlineMedium" style={styles.title}>
              Payment Successful!
            </Text>
            <Text variant="titleLarge" style={styles.amount}>
              ${amount.toFixed(2)}
            </Text>

            {/* Receipt Option */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Would you like a receipt?
              </Text>

              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={wantsReceipt ? 'checked' : 'unchecked'}
                  onPress={() => setWantsReceipt(!wantsReceipt)}
                />
                <Text
                  variant="bodyLarge"
                  style={styles.checkboxLabel}
                  onPress={() => setWantsReceipt(!wantsReceipt)}>
                  Yes, email me a receipt for tax purposes
                </Text>
              </View>

              {/* Form Fields */}
              {wantsReceipt && (
                <View style={styles.form}>
                  <TextInput
                    label="Name *"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      setErrors({...errors, name: undefined});
                    }}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.name}
                    autoCapitalize="words"
                  />
                  {errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}

                  <TextInput
                    label="Email *"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setErrors({...errors, email: undefined});
                    }}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}

                  <Text variant="bodySmall" style={styles.helpText}>
                    Your receipt will be sent to this email address
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleContinue}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}>
                {wantsReceipt ? 'Send Receipt' : 'Continue'}
              </Button>

              {wantsReceipt && (
                <Button
                  mode="text"
                  onPress={handleSkip}
                  disabled={loading}
                  style={styles.skipButton}>
                  Skip
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: isTablet ? 40 : 20,
  },
  card: {
    width: '100%',
    maxWidth: isTablet ? 600 : '100%',
    alignSelf: 'center',
    borderRadius: 20,
    elevation: 4,
  },
  cardContent: {
    padding: isTablet ? 40 : 30,
  },
  successIcon: {
    textAlign: 'center',
    color: '#10b981',
    fontSize: isTablet ? 80 : 60,
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  amount: {
    textAlign: 'center',
    marginBottom: 40,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    marginBottom: 15,
    color: '#333',
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxLabel: {
    flex: 1,
    marginLeft: 8,
    color: '#666',
  },
  form: {
    marginTop: 20,
  },
  input: {
    marginBottom: 5,
    backgroundColor: 'white',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 15,
    marginLeft: 10,
  },
  helpText: {
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    borderRadius: 12,
    marginBottom: 10,
  },
  buttonContent: {
    paddingVertical: isTablet ? 12 : 8,
  },
  skipButton: {
    marginTop: 5,
  },
});

export default ReceiptInfoScreen;
