import { View, Text, FlatList, StyleSheet, TextInput, Button} from 'react-native'
import React, { useState } from 'react'
import AlgebraQs from "./Questions/AlgebraQuestions.json";


const Question = () => {
  const [userAnswer, setUserAnswers] = useState({});
  const [feedback, setFeedback] = useState({});

  const handleInput = (text, questionId) => {
    setUserAnswers({
      ...userAnswer,
      [questionId]: text,
    });
  };

  const checkAnswer = (questionId, correctAnswer) => {
    const userInput = userAnswer[questionId]?.trim().toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();

    if (userInput && userInput === normalizedCorrectAnswer) {
      setFeedback({
        ...feedback,
        [questionId]: 'Correct',
      });
    } else {
      setFeedback({
        ...feedback,
        [questionId]: 'Incorrect',
      });
    }
  };

  const mathQuestionList = ({ item, index }) => (
    <View style={styles.card}>
      <Text style={styles.questionText}>{item.question}</Text>
      <TextInput
        placeholder="Enter your answer"
        style={styles.input}
        onChangeText={(text) => handleInput(text, index)}
        value={userAnswer[index] || ""}
      />
      <Button
        title="Check Answer"
        onPress={() => checkAnswer(index, item.answer)}
      />
      {feedback[index] && (
        <Text style={styles.feedback}>{feedback[index]}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={AlgebraQs}
        renderItem={mathQuestionList}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f7",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 4,
  },
  questionText: {
    fontSize: 16,
    color: "#333",
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderColor: "#ddd",
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  feedback: {
    marginTop: 8,
    fontSize: 16,
    color: "green",
  },
});



export default Question