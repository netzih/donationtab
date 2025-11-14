import React, {useState} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {Text, Button, Card, TextInput, IconButton} from 'react-native-paper';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../App';
import {apiService} from '../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AdminLoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AdminLogin'>;
};

const {width} = Dimensions.get('window');
const isTablet = width >= 768;

const ADMIN_TOKEN_KEY = '@admin_token';

const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({navigation}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const {token} = await apiService.adminLogin(password);
      await AsyncStorage.setItem(ADMIN_TOKEN_KEY, token);
      navigation.replace('AdminDashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Invalid password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {/* Header */}
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={handleBack}
              style={styles.backButton}
            />
            <Text variant="headlineMedium" style={styles.title}>
              Admin Access
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <TextInput
              label="Admin Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              mode="outlined"
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
              error={!!error}
              autoCapitalize="none"
              onSubmitEditing={handleLogin}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}>
              Login
            </Button>

            <Text variant="bodySmall" style={styles.helpText}>
              Default password: admin123 (change this in production!)
            </Text>
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
    maxWidth: isTablet ? 500 : '100%',
    borderRadius: 20,
    elevation: 4,
  },
  cardContent: {
    padding: isTablet ? 40 : 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 5,
    backgroundColor: 'white',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 20,
    marginLeft: 10,
  },
  button: {
    borderRadius: 12,
    marginTop: 10,
  },
  buttonContent: {
    paddingVertical: isTablet ? 12 : 8,
  },
  helpText: {
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AdminLoginScreen;
