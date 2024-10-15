import { View, Text, TextInput, Button, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import generateGPTQuestion from '../gptService'
import checkAnswer from '../checkAnswer';

const PromptScreen = () => {
    const [prompt, setPrompt] = useState('');
    const [gptQuestion, setGptQuestion] = useState(null);
    const [userResponse, setUserResponse] = useState('');
    const [gptResponse, setGptResponse] = useState('');

    const handleSend = async () => {
        try {
            const result = await generateGPTQuestion(prompt);
            console.log(result);
            setGptQuestion(result.choices[0].message.content);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAnswer = async () => {
        try {
            const result = await checkAnswer(prompt, gptQuestion,userResponse);
            console.log(result);
            setGptResponse(result.choices[0].message.content)
        } catch (error) {
            console.error(error);
        }
    };
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Ask GPT</Text>
            <TextInput
                placeholder="What is your question?"
                value={prompt}
                onChangeText={setPrompt}
                style={styles.input}
                placeholderTextColor={"black"}
            />
            <Button title="Ask Question" onPress={handleSend} />
            {gptQuestion ? (
                <Text style={styles.answer}>Prompt: {prompt}{"\n"}Answer: {gptQuestion}</Text>
            ) : (
                <Text style={styles.placeholderText}>Write a prompt</Text>
            )}
            <Text style={styles.header}>Answer</Text>
            <TextInput
                placeholder="Answer Here"
                value={userResponse}
                onChangeText={setUserResponse}
                style={styles.input}
                placeholderTextColor={"black"}
            />
            <Button title="Submit Answer" onPress={handleAnswer} />
            {gptResponse ? (
                <Text style={styles.answer}>Prompt: {userResponse}{"\n"}Answer: {gptResponse}</Text>
            ) : (
                <Text style={styles.placeholderText}>Write a prompt</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F4F8',
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#292929',
    },
    input: {
        width: '100%',
        padding: 15,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 20,
        backgroundColor: '#fff',
        color: 'black',
    },
    placeholderText: {
        fontSize: 16,
        color: 'black',
        marginTop: 20,
    },
    answer: {
        fontSize: 18,
        color: '#292929',
        marginTop: 20,
    },
});

export default PromptScreen;
