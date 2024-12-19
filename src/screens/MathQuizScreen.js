import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Image, TextInput } from 'react-native';
import CalcQues from '../assets/CalculatorIcon.png';
import NonCalcQues from '../assets/NonCalculatorIcon.png';

const MathQuizScreen = ({ route }) => {
  const { topicData } = route.params;
  const [showAnswers, setShowAnswers] = useState(topicData.questions.map(() => false));
  const [showWorking, setShowWorking ] = useState(topicData.questions.map(()=>false));
  // const [userAnswer, setUserAnswer ] = useState(topicData.questions.map(()=>''));
  // const [answerFeedback, setAnswerFeedback] = useState(topicData.questions.map(()=>null));

  const handleShowAnswer = (index) => {
    setShowAnswers((prev) => {
      const newShowAnswers = [...prev];
      newShowAnswers[index] = true;
      return newShowAnswers;
    });
  };

  // const handleInputChange = (text, index) =>{
  //   const newAnswer = [...userAnswer]
  //   newAnswer[index] = text
  //   setUserAnswer(newAnswer);
  // }

  // const handleCheckAnswer = (index) => {
  //   const isCorrect = userAnswer[index].trim().toLowerCase() === topicData.questions[index].answer.trim().toLowerCase();
  //   const newFeedback = [...answerFeedback];
  //   newFeedback[index] = isCorrect ? 'Correct!' : 'Incorrect';
  //   setAnswerFeedback(newFeedback);
  // };

  const handleShowWorking = (index) =>{
    setShowWorking((prev) => {
      const newShowWorking = [...prev];
      newShowWorking[index] = true;
      return newShowWorking;
    });
  }

  return (
    <SafeAreaView style={styles.container}>
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
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  Show Answer
                </Text>
              </TouchableOpacity>
            )}
            {/* Check Answer */}
            {/* <TextInput
              style={styles.input}
              placeholder="Enter your answer"
              value={userAnswer[index]}
              onChangeText={(text) => handleInputChange(text, index)}
            />
            {answerFeedback[index] !== null && (
              <Text style={answerFeedback[index] === 'Correct!' ? styles.correctText : styles.incorrectText}>
                {answerFeedback[index]}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={()=>handleCheckAnswer(index)}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                Check Answer
              </Text>
            </TouchableOpacity> */}
            {showWorking [index]? (
              <View style={styles.workingContainer}>
                <Text style={styles.workingText}>Working:</Text>
                <Text style={styles.answerText}>{question.working}</Text>
              </View>
            ):(
              <TouchableOpacity style={[styles.primaryButton, styles.button]} onPress={() => handleShowWorking(index)}>
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
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    width: '100%',
    marginBottom: 10,
    fontSize: 16,
    color: '#1D1D1F',
    backgroundColor: '#F3F4F6',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 15,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:5,  
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  correctText: {
    fontSize: 16,
    color: 'green',
    fontWeight: '600',
    marginTop: 10,
  },
  incorrectText: {
    fontSize: 16,
    color: 'red',
    fontWeight: '600',
    marginTop: 10,
  },
  workingText:{
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    color: '#1F2937',
  },
  workingContainer:{
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    width: '100%',
    alignItems: 'flex-start',
  },
  subtopicText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#86868B',
    marginBottom: 16,
    marginTop:5
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