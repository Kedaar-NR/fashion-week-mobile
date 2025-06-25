import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Brand {
  id: string;
  name: string;
  genre?: string;
  dropDate: string;
  status: 'upcoming' | 'live' | 'adding-soon';
  notifyEnabled: boolean;
}

// Genre colors matching the web version
const genreColors = {
  PUNK: { bg: '#8b5cf6', text: '#ffffff' },
  GOTH: { bg: '#8b5cf6', text: '#ffffff' },
  GRUNGE: { bg: '#8b5cf6', text: '#ffffff' },
  ESSENTIALS: { bg: '#3b82f6', text: '#ffffff' },
  LUXURY: { bg: '#f59e0b', text: '#ffffff' },
  VINTAGE: { bg: '#f59e0b', text: '#ffffff' },
  MINIMALISTIC: { bg: '#6b7280', text: '#ffffff' },
  'CRAZY EXPERIMENTAL': { bg: '#ec4899', text: '#ffffff' },
  Y2K: { bg: '#a78bfa', text: '#ffffff' },
  JEWELERY: { bg: '#10b981', text: '#ffffff' },
  TECHWEAR: { bg: '#06b6d4', text: '#ffffff' },
  STREET: { bg: '#ef4444', text: '#ffffff' },
};

const mockBrandsData: Brand[] = [
  {
    id: '1',
    name: '@supreme',
    genre: 'STREET/LUXURY',
    dropDate: 'Adding soon',
    status: 'adding-soon',
    notifyEnabled: false,
  },
  {
    id: '2',
    name: '@offwhite',
    genre: 'LUXURY/STREET',
    dropDate: 'Adding soon',
    status: 'adding-soon',
    notifyEnabled: true,
  },
  {
    id: '3',
    name: '@fearofgod',
    genre: 'ESSENTIALS/MINIMALISTIC',
    dropDate: 'Adding soon',
    status: 'adding-soon',
    notifyEnabled: false,
  },
  {
    id: '4',
    name: '@rickowens',
    genre: 'GOTH/LUXURY',
    dropDate: 'Adding soon',
    status: 'adding-soon',
    notifyEnabled: false,
  },
  {
    id: '5',
    name: '@vetements',
    genre: 'CRAZY EXPERIMENTAL',
    dropDate: 'Adding soon',
    status: 'adding-soon',
    notifyEnabled: true,
  },
  {
    id: '6',
    name: '@chromeheart',
    genre: 'PUNK/JEWELERY',
    dropDate: 'Adding soon',
    status: 'adding-soon',
    notifyEnabled: false,
  },
  {
    id: '7',
    name: '@stussy',
    genre: 'STREET/VINTAGE',
    dropDate: 'Adding soon',
    status: 'adding-soon',
    notifyEnabled: false,
  },
  {
    id: '8',
    name: '@acronym',
    genre: 'TECHWEAR',
    dropDate: 'Adding soon',
    status: 'adding-soon',
    notifyEnabled: false,
  },
];

export default function DropsScreen() {
  const [brands, setBrands] = useState<Brand[]>(mockBrandsData);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleNotification = (id: string) => {
    setBrands(prev => 
      prev.map(brand => 
        brand.id === id ? { ...brand, notifyEnabled: !brand.notifyEnabled } : brand
      )
    );
    
    const brand = brands.find(b => b.id === id);
    if (brand) {
      Alert.alert(
        'Notification Updated',
        `Notifications ${brand.notifyEnabled ? 'disabled' : 'enabled'} for ${brand.name}`
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#FF9500';
      case 'live': return '#34C759';
      case 'adding-soon': return '#6b7280';
      default: return '#666';
    }
  };

  const renderGenreBadges = (genre?: string) => {
    if (!genre) return null;
    
    const genres = genre.split('/').map(g => g.trim().toUpperCase());
    
    return (
      <ThemedView style={styles.genreContainer}>
        {genres.map((g, index) => {
          const colorConfig = genreColors[g as keyof typeof genreColors] || { bg: '#6b7280', text: '#ffffff' };
          return (
            <ThemedView 
              key={index} 
              style={[styles.genreBadge, { backgroundColor: colorConfig.bg }]}
            >
              <ThemedText style={[styles.genreText, { color: colorConfig.text }]}>
                {g}
              </ThemedText>
            </ThemedView>
          );
        })}
      </ThemedView>
    );
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (brand.genre && brand.genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderBrandItem = ({ item }: { item: Brand }) => (
    <ThemedView style={styles.dropItem}>
      <ThemedView style={styles.dropHeader}>
        <ThemedView style={styles.brandInfo}>
          <ThemedView style={styles.avatarPlaceholder}>
            <ThemedText style={styles.avatarText}>
              {item.name.substring(1, 3).toUpperCase()}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.brandDetails}>
            <ThemedText style={styles.brandName}>{item.name}</ThemedText>
            {renderGenreBadges(item.genre)}
          </ThemedView>
        </ThemedView>
        <TouchableOpacity
          style={[styles.notifyButton, item.notifyEnabled && styles.notifyButtonActive]}
          onPress={() => toggleNotification(item.id)}
        >
          <ThemedText style={[styles.notifyButtonText, item.notifyEnabled && styles.notifyButtonTextActive]}>
            {item.notifyEnabled ? '🔔' : '🔕'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      <ThemedText style={styles.dropDate}>{item.dropDate}</ThemedText>
    </ThemedView>
  );

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>DROP TRACKER</ThemedText>
        <ThemedText style={styles.subtitle}>
          STAY UPDATED WITH THE LATEST DROPS
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search brands or styles..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </ThemedView>

      <FlatList
        data={filteredBrands}
        keyExtractor={(item) => item.id}
        renderItem={renderBrandItem}
        style={styles.dropsList}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  dropsList: {
    flex: 1,
  },
  dropItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  notifyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifyButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  notifyButtonText: {
    fontSize: 16,
  },
  notifyButtonTextActive: {
    fontSize: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 4,
  },
  dropDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  brandDetails: {
    flex: 1,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  genreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  genreText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
