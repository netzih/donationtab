import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Dimensions} from 'react-native';
import {Text, Button, Card, TextInput, HelperText, IconButton} from 'react-native-paper';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../App';
import {apiService} from '../services/apiService';

type OrganizationRegistrationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OrganizationRegistration'>;
};

const {width} = Dimensions.get('window');
const isTablet = width >= 768;

const OrganizationRegistrationScreen: React.FC<
  OrganizationRegistrationScreenProps
> = ({navigation}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!name.trim()) {
      newErrors.name = 'Organization name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await apiService.registerOrganization({
        name: name.trim(),
        email: email.trim(),
        password,
        address: address.trim(),
        taxId: taxId.trim(),
      });

      // Show success and navigate to setup
      alert(
        `Organization "${result.organization.name}" registered successfully!\n\nSlug: ${result.organization.slug}\n\nYou can now log in to configure your Stripe keys and settings.`
      );

      navigation.replace('OrganizationSelector');
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(error.message || 'Failed to register organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Register Organization
        </Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Organization Details
            </Text>

            <TextInput
              label="Organization Name *"
              value={name}
              onChangeText={text => {
                setName(text);
                setErrors({...errors, name: ''});
              }}
              mode="outlined"
              style={styles.input}
              error={!!errors.name}
              autoCapitalize="words"
            />
            {errors.name && (
              <HelperText type="error" visible={true}>
                {errors.name}
              </HelperText>
            )}

            <TextInput
              label="Email *"
              value={email}
              onChangeText={text => {
                setEmail(text);
                setErrors({...errors, email: ''});
              }}
              mode="outlined"
              style={styles.input}
              error={!!errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <HelperText type="error" visible={true}>
                {errors.email}
              </HelperText>
            )}

            <TextInput
              label="Address"
              value={address}
              onChangeText={setAddress}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
            />

            <TextInput
              label="Tax ID (EIN)"
              value={taxId}
              onChangeText={setTaxId}
              mode="outlined"
              style={styles.input}
              placeholder="12-3456789"
            />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Admin Password
            </Text>

            <TextInput
              label="Password *"
              value={password}
              onChangeText={text => {
                setPassword(text);
                setErrors({...errors, password: ''});
              }}
              mode="outlined"
              style={styles.input}
              error={!!errors.password}
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            {errors.password && (
              <HelperText type="error" visible={true}>
                {errors.password}
              </HelperText>
            )}

            <TextInput
              label="Confirm Password *"
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
                setErrors({...errors, confirmPassword: ''});
              }}
              mode="outlined"
              style={styles.input}
              error={!!errors.confirmPassword}
              secureTextEntry={!showPassword}
            />
            {errors.confirmPassword && (
              <HelperText type="error" visible={true}>
                {errors.confirmPassword}
              </HelperText>
            )}

            <Text variant="bodySmall" style={styles.helpText}>
              After registration, you'll be able to configure your Stripe keys,
              donation amounts, and email settings from the admin panel.
            </Text>

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}>
              Register Organization
            </Button>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    padding: isTablet ? 40 : 20,
  },
  card: {
    borderRadius: 16,
    maxWidth: isTablet ? 600 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    marginBottom: 5,
    backgroundColor: 'white',
  },
  helpText: {
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
    lineHeight: 20,
  },
  registerButton: {
    marginTop: 20,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: isTablet ? 12 : 8,
  },
});

export default OrganizationRegistrationScreen;
