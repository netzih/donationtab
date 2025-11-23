import React, {useEffect} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {Text, Button, Card} from 'react-native-paper';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../App';

type ThankYouScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ThankYou'>;
};

const {width} = Dimensions.get('window');
const isTablet = width >= 768;

const ThankYouScreen: React.FC<ThankYouScreenProps> = ({navigation}) => {
  useEffect(() => {
    // Auto-navigate back to home after 10 seconds
    const timer = setTimeout(() => {
      navigation.replace('DonorHome');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const handleNewDonation = () => {
    navigation.replace('DonorHome');
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {/* Thank You Icon */}
          <Text style={styles.icon}>🙏</Text>

          {/* Thank You Message */}
          <Text variant="displaySmall" style={styles.title}>
            Thank You!
          </Text>

          <Text variant="titleLarge" style={styles.message}>
            Your generosity makes a difference
          </Text>

          <Text variant="bodyLarge" style={styles.description}>
            We are grateful for your support and contribution to our mission.
          </Text>

          {/* Return Button */}
          <Button
            mode="contained"
            onPress={handleNewDonation}
            style={styles.button}
            contentStyle={styles.buttonContent}>
            Make Another Donation
          </Button>

          <Text variant="bodySmall" style={styles.autoReturn}>
            Returning to home in 10 seconds...
          </Text>
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
    padding: isTablet ? 50 : 40,
    alignItems: 'center',
  },
  icon: {
    fontSize: isTablet ? 100 : 80,
    marginBottom: 30,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#6366f1',
    fontWeight: '600',
  },
  description: {
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
    lineHeight: 28,
  },
  button: {
    borderRadius: 12,
    marginBottom: 20,
    minWidth: isTablet ? 300 : 250,
  },
  buttonContent: {
    paddingVertical: isTablet ? 12 : 8,
  },
  autoReturn: {
    color: '#999',
    fontStyle: 'italic',
  },
});

export default ThankYouScreen;
