import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {Text, Button, Card, Searchbar, ActivityIndicator} from 'react-native-paper';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../App';
import {apiService} from '../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Organization = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
};

type OrganizationSelectorScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OrganizationSelector'>;
};

const {width} = Dimensions.get('window');
const isTablet = width >= 768;

const SELECTED_ORG_KEY = '@selected_organization';

const OrganizationSelectorScreen: React.FC<OrganizationSelectorScreenProps> = ({
  navigation,
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    filterOrganizations();
  }, [searchQuery, organizations]);

  const loadOrganizations = async () => {
    try {
      const orgs = await apiService.getOrganizations();
      setOrganizations(orgs);
      setFilteredOrgs(orgs);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterOrganizations = () => {
    if (!searchQuery.trim()) {
      setFilteredOrgs(organizations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = organizations.filter(
      org =>
        org.name.toLowerCase().includes(query) ||
        org.slug.toLowerCase().includes(query)
    );
    setFilteredOrgs(filtered);
  };

  const handleSelectOrganization = async (org: Organization) => {
    try {
      // Save selected organization
      await AsyncStorage.setItem(SELECTED_ORG_KEY, JSON.stringify(org));

      // Navigate to donor home for this organization
      navigation.replace('DonorHome', {organizationSlug: org.slug});
    } catch (error) {
      console.error('Failed to select organization:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrganizations();
  };

  const handleRegisterNew = () => {
    navigation.navigate('OrganizationRegistration');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading organizations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="displaySmall" style={styles.title}>
          DonationTab
        </Text>
        <Text variant="titleMedium" style={styles.subtitle}>
          Select Your Organization
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search organizations..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {filteredOrgs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="titleLarge" style={styles.emptyText}>
              {searchQuery ? 'No organizations found' : 'No organizations available'}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search term'
                : 'Register your organization to get started'}
            </Text>
          </View>
        ) : (
          <View style={styles.orgGrid}>
            {filteredOrgs.map(org => (
              <TouchableOpacity
                key={org.id}
                onPress={() => handleSelectOrganization(org)}>
                <Card style={styles.orgCard}>
                  <Card.Content style={styles.orgCardContent}>
                    {org.logoUrl ? (
                      <Image
                        source={{uri: org.logoUrl}}
                        style={styles.orgLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.orgLogoPlaceholder}>
                        <Text variant="headlineLarge" style={styles.orgInitial}>
                          {org.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text
                      variant="titleMedium"
                      style={styles.orgName}
                      numberOfLines={2}>
                      {org.name}
                    </Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained-tonal"
          onPress={handleRegisterNew}
          style={styles.registerButton}
          icon="plus">
          Register New Organization
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 20,
    color: '#666',
  },
  header: {
    padding: isTablet ? 40 : 30,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 10,
  },
  subtitle: {
    color: '#666',
  },
  searchContainer: {
    padding: isTablet ? 20 : 15,
    backgroundColor: 'white',
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isTablet ? 20 : 15,
  },
  orgGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isTablet ? 20 : 15,
    justifyContent: 'flex-start',
  },
  orgCard: {
    width: isTablet ? 180 : 150,
    borderRadius: 16,
    elevation: 2,
  },
  orgCardContent: {
    padding: isTablet ? 20 : 15,
    alignItems: 'center',
    minHeight: isTablet ? 200 : 170,
    justifyContent: 'center',
  },
  orgLogo: {
    width: isTablet ? 80 : 60,
    height: isTablet ? 80 : 60,
    marginBottom: 15,
  },
  orgLogoPlaceholder: {
    width: isTablet ? 80 : 60,
    height: isTablet ? 80 : 60,
    borderRadius: isTablet ? 40 : 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  orgInitial: {
    color: 'white',
    fontWeight: 'bold',
  },
  orgName: {
    textAlign: 'center',
    color: '#333',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    color: '#999',
  },
  footer: {
    padding: isTablet ? 20 : 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  registerButton: {
    borderRadius: 12,
  },
});

export default OrganizationSelectorScreen;
