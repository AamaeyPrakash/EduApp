import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Image, TextInput } from 'react-native';
import CalcQues from '../assets/CalculatorIconWhite.png';
import NonCalcQues from '../assets/NonCalculatorIconWhite.png';

const MathQuizScreen = ({ route, navigation }) => {
  const { topicData } = route.params;
  const [showAnswers, setShowAnswers] = useState(topicData.questions.map(() => false));
  const [showWorking, setShowWorking ] = useState(topicData.questions.map(()=>false));

  const handleShowAnswer = (index) => {
    setShowAnswers((prev) => {
      const newShowAnswers = [...prev];
      newShowAnswers[index] = true;
      return newShowAnswers;
    });
  };

  const handleShowWorking = (index) =>{
    setShowWorking((prev) => {
      const newShowWorking = [...prev];
      newShowWorking[index] = true;
      return newShowWorking;
    });
  }

  const handleExit = () => {
    navigation.goBack(); // Goes back to the previous screen (Math AA, Math AI, or CBSE 12)
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={handleExit}
          activeOpacity={0.8}
        >
          <Text style={styles.exitButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.topicText}>{topicData.topic}</Text>
        {topicData.questions.map((question, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.QuesDetailContainer}>
              <Image
                source={question.calculator === "yes" ? CalcQues : NonCalcQues}
                style={styles.CalcIcon}
              />
              <Text style={styles.subtopicText}>Concept: {question.subtopic}</Text>
            </View>
            <Text style={styles.questionText}>{question.question}</Text>
            {showAnswers[index] ? (
              <Text style={styles.answerText}>{question.answer}</Text>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => handleShowAnswer(index)}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  Show Answer
                </Text>
              </TouchableOpacity>
            )}
            {showWorking [index]? (
              <View style={styles.workingContainer}>
                <Text style={styles.workingText}>Working:</Text>
                <Text style={styles.answerText}>{question.working}</Text>
              </View>
            ):(
              <TouchableOpacity 
                style={[styles.primaryButton, styles.button]} 
                onPress={() => handleShowWorking(index)}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>Show Working</Text>
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
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  exitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    // Neomorphism effect
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  exitButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  topicText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: -0.34,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backdropFilter: 'blur(30px)',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -0.24,
  },
  answerText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#EBEBF5',
    opacity: 0.8,
    letterSpacing: -0.16,
  },
  button: {
    backgroundColor: 'rgba(10, 132, 255, 0.9)',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.16,
  },
  workingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'left',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.24,
  },
  workingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    width: '100%',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  subtopicText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EBEBF5',
    marginBottom: 16,
    marginTop: 5,
    opacity: 0.7,
    letterSpacing: -0.14,
  },
  QuesDetailContainer: {
    flexDirection: 'row', 
    alignItems: 'top', 
    marginBottom: 16,
  },
  CalcIcon: {
    width: 30,
    height: 30,
    marginRight: 15,
  },
});

export default MathQuizScreen;