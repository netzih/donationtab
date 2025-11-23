import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, Dimensions, Alert} from 'react-native';
import {
  Text,
  Button,
  Card,
  TextInput,
  IconButton,
  Divider,
  Chip,
  Switch,
} from 'react-native-paper';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../App';
import {
  loadConfig,
  saveConfig,
  updateDonationAmounts,
  updateStripeKeys,
  updateOrganizationInfo,
  updateEmailTemplate,
} from '../services/configService';
import type {AppConfig, DonationAmount} from '../types';

type AdminDashboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AdminDashboard'>;
};

const {width} = Dimensions.get('window');
const isTablet = width >= 768;

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  navigation,
}) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [activeTab, setActiveTab] = useState<
    'stripe' | 'amounts' | 'organization' | 'email'
  >('stripe');

  // Stripe Keys
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');

  // Donation Amounts
  const [amounts, setAmounts] = useState<DonationAmount[]>([]);
  const [newAmount, setNewAmount] = useState('');
  const [allowCustomAmount, setAllowCustomAmount] = useState(true);

  // Organization Info
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgTaxId, setOrgTaxId] = useState('');

  // Email Template
  const [emailTemplate, setEmailTemplate] = useState('');

  useEffect(() => {
    loadAppConfig();
  }, []);

  const loadAppConfig = async () => {
    const appConfig = await loadConfig();
    setConfig(appConfig);
    setStripePublishableKey(appConfig.stripePublishableKey);
    setStripeSecretKey(appConfig.stripeSecretKey);
    setAmounts(appConfig.donationAmounts);
    setAllowCustomAmount(appConfig.allowCustomAmount);
    setOrgName(appConfig.organizationName);
    setOrgEmail(appConfig.organizationEmail);
    setOrgAddress(appConfig.organizationAddress);
    setOrgTaxId(appConfig.organizationTaxId);
    setEmailTemplate(appConfig.emailTemplate);
  };

  const handleSaveStripeKeys = async () => {
    try {
      await updateStripeKeys(stripePublishableKey, stripeSecretKey);
      Alert.alert('Success', 'Stripe keys updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update Stripe keys');
    }
  };

  const handleAddAmount = () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const newDonationAmount: DonationAmount = {
      id: Date.now().toString(),
      amount,
      label: `$${amount}`,
    };

    setAmounts([...amounts, newDonationAmount]);
    setNewAmount('');
  };

  const handleRemoveAmount = (id: string) => {
    setAmounts(amounts.filter(a => a.id !== id));
  };

  const handleSaveAmounts = async () => {
    try {
      await updateDonationAmounts(amounts);
      const updatedConfig = await loadConfig();
      updatedConfig.allowCustomAmount = allowCustomAmount;
      await saveConfig(updatedConfig);
      Alert.alert('Success', 'Donation amounts updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update donation amounts');
    }
  };

  const handleSaveOrganization = async () => {
    try {
      await updateOrganizationInfo(orgName, orgEmail, orgAddress, orgTaxId);
      Alert.alert('Success', 'Organization info updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update organization info');
    }
  };

  const handleSaveEmailTemplate = async () => {
    try {
      await updateEmailTemplate(emailTemplate);
      Alert.alert('Success', 'Email template updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update email template');
    }
  };

  const handleLogout = () => {
    navigation.replace('DonorHome');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stripe':
        return (
          <View>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Stripe Configuration
            </Text>
            <TextInput
              label="Publishable Key"
              value={stripePublishableKey}
              onChangeText={setStripePublishableKey}
              mode="outlined"
              style={styles.input}
              placeholder="pk_test_..."
            />
            <TextInput
              label="Secret Key"
              value={stripeSecretKey}
              onChangeText={setStripeSecretKey}
              mode="outlined"
              style={styles.input}
              placeholder="sk_test_..."
              secureTextEntry
            />
            <Button
              mode="contained"
              onPress={handleSaveStripeKeys}
              style={styles.saveButton}>
              Save Stripe Keys
            </Button>
          </View>
        );

      case 'amounts':
        return (
          <View>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Donation Amounts
            </Text>

            {/* Current Amounts */}
            <View style={styles.chipContainer}>
              {amounts.map(amount => (
                <Chip
                  key={amount.id}
                  onClose={() => handleRemoveAmount(amount.id)}
                  style={styles.chip}>
                  ${amount.amount}
                </Chip>
              ))}
            </View>

            {/* Add New Amount */}
            <View style={styles.addAmountContainer}>
              <TextInput
                label="New Amount"
                value={newAmount}
                onChangeText={setNewAmount}
                mode="outlined"
                keyboardType="decimal-pad"
                style={styles.amountInput}
                left={<TextInput.Affix text="$" />}
              />
              <Button
                mode="contained-tonal"
                onPress={handleAddAmount}
                style={styles.addButton}>
                Add
              </Button>
            </View>

            {/* Custom Amount Toggle */}
            <View style={styles.switchContainer}>
              <Text variant="bodyLarge">Allow custom amounts</Text>
              <Switch
                value={allowCustomAmount}
                onValueChange={setAllowCustomAmount}
              />
            </View>

            <Button
              mode="contained"
              onPress={handleSaveAmounts}
              style={styles.saveButton}>
              Save Donation Amounts
            </Button>
          </View>
        );

      case 'organization':
        return (
          <View>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Organization Information
            </Text>
            <TextInput
              label="Organization Name"
              value={orgName}
              onChangeText={setOrgName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Email"
              value={orgEmail}
              onChangeText={setOrgEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
            />
            <TextInput
              label="Address"
              value={orgAddress}
              onChangeText={setOrgAddress}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
            />
            <TextInput
              label="Tax ID"
              value={orgTaxId}
              onChangeText={setOrgTaxId}
              mode="outlined"
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleSaveOrganization}
              style={styles.saveButton}>
              Save Organization Info
            </Button>
          </View>
        );

      case 'email':
        return (
          <View>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Email Receipt Template
            </Text>
            <Text variant="bodySmall" style={styles.helpText}>
              Available placeholders: {'{name}'}, {'{amount}'}, {'{organization}'},
              {'{taxId}'}, {'{date}'}
            </Text>
            <TextInput
              value={emailTemplate}
              onChangeText={setEmailTemplate}
              mode="outlined"
              style={styles.templateInput}
              multiline
              numberOfLines={15}
            />
            <Button
              mode="contained"
              onPress={handleSaveEmailTemplate}
              style={styles.saveButton}>
              Save Email Template
            </Button>
          </View>
        );

      default:
        return null;
    }
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
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={handleLogout} />
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Admin Dashboard
        </Text>
        <IconButton icon="logout" size={24} onPress={handleLogout} />
      </View>

      <Divider />

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}>
        <Button
          mode={activeTab === 'stripe' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('stripe')}
          style={styles.tab}>
          Stripe
        </Button>
        <Button
          mode={activeTab === 'amounts' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('amounts')}
          style={styles.tab}>
          Amounts
        </Button>
        <Button
          mode={activeTab === 'organization' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('organization')}
          style={styles.tab}>
          Organization
        </Button>
        <Button
          mode={activeTab === 'email' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('email')}
          style={styles.tab}>
          Email
        </Button>
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>{renderTabContent()}</Card.Content>
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
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  tabBar: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  tab: {
    marginRight: 10,
  },
  content: {
    flex: 1,
    padding: isTablet ? 30 : 20,
  },
  card: {
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'white',
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    marginRight: 5,
    marginBottom: 5,
  },
  addAmountContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  amountInput: {
    flex: 1,
    backgroundColor: 'white',
  },
  addButton: {
    justifyContent: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  templateInput: {
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: 'white',
    minHeight: 300,
  },
  helpText: {
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
  },
});

export default AdminDashboardScreen;
