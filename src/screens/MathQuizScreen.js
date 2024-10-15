import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

const MathQuizScreen = ({ route }) => {
  const { topicData } = route.params;
  const [showAnswers, setShowAnswers] = useState(topicData.questions.map(() => false));

  const handleShowAnswer = (index) => {
    setShowAnswers((prev) => {
      const newShowAnswers = [...prev];
      newShowAnswers[index] = true;
      return newShowAnswers;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.topicText}>{topicData.topic}</Text>
        {topicData.questions.map((question, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.subtopicText}>Concept: {question.subtopic}</Text>
            <Text style={styles.questionText}>{question.question}</Text>
            {showAnswers[index] ? (
              <Text style={styles.answerText}>{question.answer}</Text>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => handleShowAnswer(index)}
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  Show Answer
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  topicText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  subtopicText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#86868B',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  answerText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#86868B',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 15,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MathQuizScreen;