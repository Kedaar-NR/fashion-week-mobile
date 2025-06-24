import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Drop {
  id: string;
  brand: string;
  productName: string;
  dropDate: string;
  price: string;
  status: 'upcoming' | 'live' | 'sold-out';
  notifyEnabled: boolean;
}

const mockDropData: Drop[] = [
  {
    id: '1',
    brand: 'Supreme',
    productName: 'Box Logo Hoodie',
    dropDate: '2024-06-28T11:00:00Z',
    price: '$158',
    status: 'upcoming',
    notifyEnabled: true,
  },
  {
    id: '2',
    brand: 'Off-White',
    productName: 'Industrial Belt 2.0',
    dropDate: '2024-06-25T10:00:00Z',
    price: '$245',
    status: 'live',
    notifyEnabled: false,
  },
  {
    id: '3',
    brand: 'Fear of God Essentials',
    productName: 'Oversized T-Shirt',
    dropDate: '2024-06-20T09:00:00Z',
    price: '$85',
    status: 'sold-out',
    notifyEnabled: false,
  },
];

export default function DropsScreen() {
  const [drops, setDrops] = useState<Drop[]>(mockDropData);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live'>('all');

  const toggleNotification = (id: string) => {
    setDrops(prev => 
      prev.map(drop => 
        drop.id === id ? { ...drop, notifyEnabled: !drop.notifyEnabled } : drop
      )
    );
    
    const drop = drops.find(d => d.id === id);
    if (drop) {
      Alert.alert(
        'Notification Updated',
        `Notifications ${drop.notifyEnabled ? 'disabled' : 'enabled'} for ${drop.productName}`
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#FF9500';
      case 'live': return '#34C759';
      case 'sold-out': return '#FF3B30';
      default: return '#666';
    }
  };

  const formatDropDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0) return `In ${diffDays} days`;
    return 'Past drop';
  };

  const filteredDrops = filter === 'all' 
    ? drops 
    : drops.filter(drop => drop.status === filter);

  const renderDropItem = ({ item }: { item: Drop }) => (
    <ThemedView style={styles.dropItem}>
      <ThemedView style={styles.dropHeader}>
        <ThemedView style={styles.brandInfo}>
          <ThemedText style={styles.brandName}>{item.brand}</ThemedText>
          <ThemedView style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <ThemedText style={styles.statusText}>{item.status.toUpperCase()}</ThemedText>
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
      
      <ThemedText style={styles.productName}>{item.productName}</ThemedText>
      <ThemedText style={styles.price}>{item.price}</ThemedText>
      <ThemedText style={styles.dropDate}>
        {item.status === 'upcoming' ? formatDropDate(item.dropDate) : item.status === 'live' ? 'Live Now!' : 'Ended'}
      </ThemedText>
    </ThemedView>
  );

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Drop Tracker</ThemedText>
        <ThemedText style={styles.subtitle}>
          Stay updated on the latest fashion drops
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <ThemedText style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'upcoming' && styles.activeFilter]}
          onPress={() => setFilter('upcoming')}
        >
          <ThemedText style={[styles.filterText, filter === 'upcoming' && styles.activeFilterText]}>
            Upcoming
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'live' && styles.activeFilter]}
          onPress={() => setFilter('live')}
        >
          <ThemedText style={[styles.filterText, filter === 'live' && styles.activeFilterText]}>
            Live
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <FlatList
        data={filteredDrops}
        keyExtractor={(item) => item.id}
        renderItem={renderDropItem}
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
});
