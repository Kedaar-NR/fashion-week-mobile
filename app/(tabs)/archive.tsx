import React from 'react';
import { StyleSheet, ScrollView, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface ArchiveItem {
  id: string;
  title: string;
  date: string;
  description: string;
}

const mockArchiveData: ArchiveItem[] = [
  {
    id: '1',
    title: 'Fall/Winter 2024 Collection',
    date: 'March 2024',
    description: 'Complete archive of Fall/Winter runway shows and collections.',
  },
  {
    id: '2',
    title: 'Spring/Summer 2024 Collection',
    date: 'September 2023',
    description: 'Spring/Summer fashion week highlights and designer showcases.',
  },
  {
    id: '3',
    title: 'Couture Week 2024',
    date: 'January 2024',
    description: 'Haute couture collections from Paris Fashion Week.',
  },
];

export default function ArchiveScreen() {
  const renderArchiveItem = ({ item }: { item: ArchiveItem }) => (
    <ThemedView style={styles.archiveItem}>
      <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
      <ThemedText style={styles.itemDate}>{item.date}</ThemedText>
      <ThemedText style={styles.itemDescription}>{item.description}</ThemedText>
    </ThemedView>
  );

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Fashion Archive</ThemedText>
        <ThemedText style={styles.subtitle}>
          Browse through past collections and runway shows
        </ThemedText>
      </ThemedView>

      <FlatList
        data={mockArchiveData}
        keyExtractor={(item) => item.id}
        renderItem={renderArchiveItem}
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
  list: {
    flex: 1,
  },
  archiveItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
