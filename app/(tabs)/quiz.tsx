import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
}

interface QuizResult {
  style: string;
  description: string;
  recommendations: string[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: '1',
    question: 'What\'s your ideal weekend outfit?',
    options: [
      'Comfy jeans and a vintage band tee',
      'A flowy dress with sandals',
      'Tailored pants with a crisp button-down',
      'Athleisure wear with trendy sneakers'
    ]
  },
  {
    id: '2',
    question: 'Which fashion era inspires you most?',
    options: [
      '90s grunge and streetwear',
      '70s bohemian and free-spirited',
      'Classic 50s elegance and sophistication',
      'Modern minimalism and clean lines'
    ]
  },
  {
    id: '3',
    question: 'What\'s your go-to accessory?',
    options: [
      'Statement sneakers or boots',
      'Layered jewelry and scarves',
      'A structured handbag',
      'Sleek smartwatch or minimal jewelry'
    ]
  }
];

const styleResults: { [key: string]: QuizResult } = {
  'casual': {
    style: 'Casual Chic',
    description: 'You love comfort with a touch of style. Your wardrobe is versatile and effortless.',
    recommendations: ['Denim jackets', 'White sneakers', 'Basic tees', 'Comfortable jeans']
  },
  'bohemian': {
    style: 'Bohemian Spirit',
    description: 'You\'re drawn to free-flowing fabrics and earthy tones. Your style is artistic and relaxed.',
    recommendations: ['Maxi dresses', 'Fringe bags', 'Layered necklaces', 'Ankle boots']
  },
  'classic': {
    style: 'Timeless Classic',
    description: 'You appreciate quality and elegance. Your style is sophisticated and polished.',
    recommendations: ['Blazers', 'Pearl jewelry', 'Silk scarves', 'Leather pumps']
  },
  'modern': {
    style: 'Modern Minimalist',
    description: 'You prefer clean lines and contemporary designs. Your style is sleek and functional.',
    recommendations: ['Structured coats', 'Geometric jewelry', 'Neutral colors', 'Platform sneakers']
  }
};

export default function QuizScreen() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate result based on answers
      const styleMapping = ['casual', 'bohemian', 'classic', 'modern'];
      const styleCounts = styleMapping.map(style => 
        newAnswers.filter(answer => styleMapping[answer] === style).length
      );
      const dominantStyleIndex = styleCounts.indexOf(Math.max(...styleCounts));
      const dominantStyle = styleMapping[dominantStyleIndex];
      
      setResult(styleResults[dominantStyle]);
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResult(false);
    setResult(null);
  };

  if (showResult && result) {
    return (
      <ScrollView style={styles.container}>
        <ThemedView style={styles.resultContainer}>
          <ThemedText style={styles.resultTitle}>Your Style Profile</ThemedText>
          <ThemedView style={styles.resultCard}>
            <ThemedText style={styles.styleType}>{result.style}</ThemedText>
            <ThemedText style={styles.styleDescription}>{result.description}</ThemedText>
            
            <ThemedText style={styles.recommendationsTitle}>Recommended Items:</ThemedText>
            {result.recommendations.map((item, index) => (
              <ThemedView key={index} style={styles.recommendationItem}>
                <ThemedText style={styles.recommendationText}>• {item}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
          
          <TouchableOpacity style={styles.retakeButton} onPress={resetQuiz}>
            <ThemedText style={styles.retakeButtonText}>Retake Quiz</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Style Quiz</ThemedText>
        <ThemedText style={styles.subtitle}>
          Discover your personal fashion style
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.progressContainer}>
        <ThemedText style={styles.progressText}>
          Question {currentQuestion + 1} of {quizQuestions.length}
        </ThemedText>
        <ThemedView style={styles.progressBar}>
          <ThemedView 
            style={[
              styles.progressFill, 
              { width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }
            ]} 
          />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.questionContainer}>
        <ThemedText style={styles.question}>
          {quizQuestions[currentQuestion].question}
        </ThemedText>
        
        <ThemedView style={styles.optionsContainer}>
          {quizQuestions[currentQuestion].options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => handleAnswer(index)}
            >
              <ThemedText style={styles.optionText}>{option}</ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 32,
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
  progressContainer: {
    marginBottom: 32,
  },
  progressText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  questionContainer: {
    flex: 1,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  optionText: {
    fontSize: 16,
    lineHeight: 22,
  },
  resultContainer: {
    flex: 1,
    paddingTop: 20,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  resultCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
    marginBottom: 24,
  },
  styleType: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#007AFF',
  },
  styleDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  recommendationItem: {
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 22,
  },
  retakeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
