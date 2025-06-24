import React, { useState } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface SearchResult {
  id: string;
  type: 'designer' | 'collection' | 'trend';
  title: string;
  subtitle: string;
  description: string;
}

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    type: 'designer',
    title: 'Virgil Abloh',
    subtitle: 'Off-White, Louis Vuitton',
    description: 'Pioneering streetwear meets luxury fashion',
  },
  {
    id: '2',
    type: 'collection',
    title: 'Dior Spring 2024',
    subtitle: 'Maria Grazia Chiuri',
    description: 'Feminine silhouettes with modern sustainability focus',
  },
  {
    id: '3',
    type: 'trend',
    title: 'Oversized Blazers',
    subtitle: 'Trending Now',
    description: 'Power dressing with relaxed tailoring',
  },
  {
    id: '4',
    type: 'designer',
    title: 'Jacquemus',
    subtitle: 'Simon Porte Jacquemus',
    description: 'French minimalism with playful proportions',
  },
];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setIsSearching(true);
      // Simulate search delay
      setTimeout(() => {
        const filtered = mockSearchResults.filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
        setIsSearching(false);
      }, 300);
    } else {
      setSearchResults([]);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'designer': return '#FF6B6B';
      case 'collection': return '#4ECDC4';
      case 'trend': return '#45B7D1';
      default: return '#666';
    }
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.resultItem}>
      <ThemedView style={styles.resultContent}>
        <ThemedView style={styles.resultHeader}>
          <ThemedText style={styles.resultTitle}>{item.title}</ThemedText>
          <ThemedView style={[styles.typeTag, { backgroundColor: getTypeColor(item.type) }]}>
            <ThemedText style={styles.typeText}>{item.type}</ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedText style={styles.resultSubtitle}>{item.subtitle}</ThemedText>
        <ThemedText style={styles.resultDescription}>{item.description}</ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Search Fashion</ThemedText>
        <ThemedText style={styles.subtitle}>
          Find designers, collections, and trends
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search designers, collections, trends..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
      </ThemedView>

      {isSearching && (
        <ThemedView style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Searching...</ThemedText>
        </ThemedView>
      )}

      {searchQuery.length > 0 && !isSearching && (
        <ThemedView style={styles.resultsHeader}>
          <ThemedText style={styles.resultsCount}>
            {searchResults.length} results for "{searchQuery}"
          </ThemedText>
        </ThemedView>
      )}

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={renderSearchResult}
        style={styles.resultsList}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />

      {searchQuery.length === 0 && (
        <ThemedView style={styles.emptyState}>
          <ThemedText style={styles.emptyStateText}>
            Start typing to search for fashion content
          </ThemedText>
        </ThemedView>
      )}
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.6,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    opacity: 0.7,
    fontWeight: '500',
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  resultContent: {
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  resultSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    opacity: 0.5,
    textAlign: 'center',
  },
});
