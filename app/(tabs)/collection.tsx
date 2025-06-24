import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface CollectionItem {
  id: string;
  name: string;
  designer: string;
  season: string;
  image: string;
  saved: boolean;
}

const mockCollectionData: CollectionItem[] = [
  {
    id: '1',
    name: 'Urban Elegance',
    designer: 'Stella McCartney',
    season: 'Spring/Summer 2024',
    image: 'placeholder',
    saved: true,
  },
  {
    id: '2',
    name: 'Minimalist Dreams',
    designer: 'Calvin Klein',
    season: 'Fall/Winter 2024',
    image: 'placeholder',
    saved: false,
  },
  {
    id: '3',
    name: 'Vintage Revival',
    designer: 'Marc Jacobs',
    season: 'Spring/Summer 2024',
    image: 'placeholder',
    saved: true,
  },
];

export default function CollectionScreen() {
  const [collections, setCollections] = useState<CollectionItem[]>(mockCollectionData);
  const [filter, setFilter] = useState<'all' | 'saved'>('all');

  const toggleSave = (id: string) => {
    setCollections(prev => 
      prev.map(item => 
        item.id === id ? { ...item, saved: !item.saved } : item
      )
    );
  };

  const filteredCollections = filter === 'saved' 
    ? collections.filter(item => item.saved)
    : collections;

  const renderCollectionItem = ({ item }: { item: CollectionItem }) => (
    <ThemedView style={styles.collectionItem}>
      <ThemedView style={styles.imagePlaceholder}>
        <ThemedText style={styles.imagePlaceholderText}>Image</ThemedText>
      </ThemedView>
      <ThemedView style={styles.itemInfo}>
        <ThemedText style={styles.itemName}>{item.name}</ThemedText>
        <ThemedText style={styles.itemDesigner}>{item.designer}</ThemedText>
        <ThemedText style={styles.itemSeason}>{item.season}</ThemedText>
        <TouchableOpacity 
          style={[styles.saveButton, item.saved && styles.savedButton]}
          onPress={() => toggleSave(item.id)}
        >
          <ThemedText style={[styles.saveButtonText, item.saved && styles.savedButtonText]}>
            {item.saved ? 'Saved' : 'Save'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>My Collections</ThemedText>
        <ThemedText style={styles.subtitle}>
          Curate and save your favorite fashion pieces
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
          style={[styles.filterButton, filter === 'saved' && styles.activeFilter]}
          onPress={() => setFilter('saved')}
        >
          <ThemedText style={[styles.filterText, filter === 'saved' && styles.activeFilterText]}>
            Saved
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <FlatList
        data={filteredCollections}
        keyExtractor={(item) => item.id}
        renderItem={renderCollectionItem}
        style={styles.list}
        scrollEnabled={false}
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
  list: {
    flex: 1,
  },
  collectionItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  imagePlaceholderText: {
    fontSize: 12,
    opacity: 0.5,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDesigner: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  itemSeason: {
    fontSize: 12,
    opacity: 0.5,
    marginBottom: 8,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignSelf: 'flex-start',
  },
  savedButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  savedButtonText: {
    color: 'white',
  },
});
