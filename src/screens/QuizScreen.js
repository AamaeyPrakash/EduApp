import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

const QuizScreen = ({ route }) => {
  const { topicData } = route.params; 
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const currentQuestion = topicData.questions[currentQuestionIndex];

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => (prevIndex + 1) % topicData.questions.length);
    setShowAnswer(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.topicText}>{topicData.topic}</Text>
        <Text style={styles.subtopicText}>{currentQuestion.subtopic}</Text>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        {showAnswer && <Text style={styles.answerText}>{currentQuestion.answer}</Text>}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, !showAnswer && styles.primaryButton]}
          onPress={handleShowAnswer}
          disabled={showAnswer}
        >
          <Text style={[styles.buttonText, !showAnswer && styles.primaryButtonText]}>
            Show Answer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleNextQuestion}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            Next Question
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    aspectRatio: 3 / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF', 
    marginBottom: 4,
  },
  subtopicText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#86868B',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1D1D1F', 
  },
  answerText: {
    fontSize: 20,
    marginTop: 20,
    textAlign: 'center',
    color: '#86868B', 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginTop: 30,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    width: '45%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#007AFF', 
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF', 
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  loadingText: {
    fontSize: 18,
    color: '#86868B',
  },
});

export default QuizScreen;
