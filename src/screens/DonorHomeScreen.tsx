import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  TextInput as RNTextInput,
} from 'react-native';
import {Text, Button, Card, TextInput} from 'react-native-paper';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../App';
import {loadConfig} from '../services/configService';
import type {AppConfig} from '../types';

type DonorHomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DonorHome'>;
};

const {width, height} = Dimensions.get('window');
const isTablet = width >= 768;

const DonorHomeScreen: React.FC<DonorHomeScreenProps> = ({navigation}) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    loadAppConfig();
  }, []);

  const loadAppConfig = async () => {
    const appConfig = await loadConfig();
    setConfig(appConfig);
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setShowCustomInput(false);
    setCustomAmount('');
  };

  const handleCustomAmountSelect = () => {
    setShowCustomInput(true);
    setSelectedAmount(null);
  };

  const handleContinue = () => {
    const amount = showCustomInput
      ? parseFloat(customAmount)
      : selectedAmount;

    if (amount && amount > 0) {
      navigation.navigate('Payment', {amount});
    }
  };

  const isValidAmount = () => {
    if (showCustomInput) {
      const amount = parseFloat(customAmount);
      return !isNaN(amount) && amount > 0;
    }
    return selectedAmount !== null;
  };

  if (!config) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        {config.logoUri && (
          <View style={styles.logoContainer}>
            <Image
              source={{uri: config.logoUri}}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Organization Name */}
        <Text variant="headlineLarge" style={styles.orgName}>
          {config.organizationName}
        </Text>

        <Text variant="titleLarge" style={styles.title}>
          Select Donation Amount
        </Text>

        {/* Amount Options Grid */}
        <View style={styles.amountGrid}>
          {config.donationAmounts.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.amountCard,
                selectedAmount === option.amount && styles.amountCardSelected,
              ]}
              onPress={() => handleAmountSelect(option.amount)}>
              <Text
                variant="headlineMedium"
                style={[
                  styles.amountText,
                  selectedAmount === option.amount && styles.amountTextSelected,
                ]}>
                ${option.amount}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Custom Amount Card */}
          {config.allowCustomAmount && (
            <TouchableOpacity
              style={[
                styles.amountCard,
                showCustomInput && styles.amountCardSelected,
              ]}
              onPress={handleCustomAmountSelect}>
              <Text
                variant="headlineMedium"
                style={[
                  styles.amountText,
                  showCustomInput && styles.amountTextSelected,
                ]}>
                Custom
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Custom Amount Input */}
        {showCustomInput && (
          <Card style={styles.customAmountCard}>
            <Card.Content>
              <TextInput
                label="Enter Amount"
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="decimal-pad"
                mode="outlined"
                left={<TextInput.Affix text="$" />}
                style={styles.customInput}
                autoFocus
              />
            </Card.Content>
          </Card>
        )}

        {/* Continue Button */}
        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!isValidAmount()}
          style={styles.continueButton}
          contentStyle={styles.continueButtonContent}>
          <Text variant="titleLarge" style={styles.buttonText}>
            Continue to Payment
          </Text>
        </Button>

        {/* Admin Access */}
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminLogin')}
          style={styles.adminLink}>
          <Text variant="bodySmall" style={styles.adminLinkText}>
            Admin Access
          </Text>
        </TouchableOpacity>
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
    padding: isTablet ? 40 : 20,
    alignItems: 'center',
  },
  logoContainer: {
    marginTop: 20,
    marginBottom: 20,
    width: isTablet ? 200 : 150,
    height: isTablet ? 200 : 150,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  orgName: {
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
    color: '#333',
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: isTablet ? 20 : 15,
    marginBottom: 30,
    maxWidth: isTablet ? 600 : '100%',
  },
  amountCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: isTablet ? 30 : 20,
    minWidth: isTablet ? 140 : 100,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  amountCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  amountText: {
    fontWeight: 'bold',
    color: '#333',
  },
  amountTextSelected: {
    color: '#6366f1',
  },
  customAmountCard: {
    width: '100%',
    maxWidth: isTablet ? 400 : '100%',
    marginBottom: 30,
  },
  customInput: {
    fontSize: isTablet ? 24 : 18,
  },
  continueButton: {
    width: '100%',
    maxWidth: isTablet ? 400 : '100%',
    marginTop: 20,
    borderRadius: 12,
  },
  continueButtonContent: {
    paddingVertical: isTablet ? 12 : 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  adminLink: {
    marginTop: 40,
    padding: 10,
  },
  adminLinkText: {
    color: '#999',
    textDecorationLine: 'underline',
  },
});

export default DonorHomeScreen;
