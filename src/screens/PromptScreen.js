import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import generateGPTQuestion from '../gptService'
import checkAnswer from '../checkAnswer';

const PromptScreen = () => {
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState([]);

    const handleSend = async () => {
        if (prompt.trim()) {
            setMessages([...messages, { text: prompt, type: 'user' }]);
            setPrompt('');
            try {
                const result = await generateGPTQuestion(prompt);
                const gptResponse = result.choices[0].message.content;
                setMessages((prevMessages) => [...prevMessages, { text: gptResponse, type: 'gpt' }]);
            } catch (error) {
                console.error(error);
            }
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.chatContainer}>
                {messages.map((message, index) => (
                    <View key={index} style={[styles.messageBubble, message.type === 'user' ? styles.userBubble : styles.gptBubble]}>
                        <Text style={styles.messageText}>{message.text}</Text>
                    </View>
                ))}
            </ScrollView>
            <View style={styles.inputContainer}>
                <TextInput
                    placeholder="Type your message..."
                    value={prompt}
                    onChangeText={setPrompt}
                    style={styles.input}
                    placeholderTextColor={"#888"}
                />
                <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4F8',
    },
    chatContainer: {
        flex: 1,
        padding: 10,
    },
    messageBubble: {
        padding: 15,
        borderRadius: 20,
        marginVertical: 5,
        maxWidth: '80%',
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#A3C1DA',
    },
    gptBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
    },
    messageText: {
        color: '#333333',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#ddd',
    },
    input: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        backgroundColor: '#fff',
        color:'#333333',
    },
    sendButton: {
        marginLeft: 10,
        backgroundColor: '#3B82F6',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default PromptScreen;
