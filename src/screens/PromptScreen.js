import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native'
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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>AskGPT</Text>
            </View>
            
            <ScrollView 
                style={styles.chatContainer}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>Start a conversation with AI</Text>
                        <Text style={styles.emptyStateSubtext}>Ask me anything and I'll help you learn!</Text>
                    </View>
                ) : (
                    messages.map((message, index) => (
                        <View key={index} style={[styles.messageBubble, message.type === 'user' ? styles.userBubble : styles.gptBubble]}>
                            <Text style={[styles.messageText, message.type === 'user' ? styles.userText : styles.gptText]}>
                                {message.text}
                            </Text>
                        </View>
                    ))
                )}
            </ScrollView>
            
            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        placeholder="Type your message..."
                        value={prompt}
                        onChangeText={setPrompt}
                        style={styles.input}
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity 
                        onPress={handleSend} 
                        style={[styles.sendButton, !prompt.trim() && styles.sendButtonDisabled]}
                        disabled={!prompt.trim()}
                    >
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'exo',
        letterSpacing: -0.5,
    },
    chatContainer: {
        flex: 1,
    },
    chatContent: {
        padding: 20,
        paddingBottom: 100, // Extra padding for tab bar
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
        fontFamily: 'exo',
    },
    emptyStateSubtext: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        fontFamily: 'exo',
    },
    messageBubble: {
        padding: 16,
        borderRadius: 20,
        marginVertical: 6,
        maxWidth: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#0A84FF',
        borderBottomRightRadius: 8,
    },
    gptBubble: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderBottomLeftRadius: 8,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
        fontFamily: 'exo',
    },
    userText: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    gptText: {
        color: '#FFFFFF',
        fontWeight: '400',
    },
    inputContainer: {
        position: 'absolute',
        bottom: 70, // Above tab bar
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 50,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'exo',
        maxHeight: 100,
        paddingVertical: 8,
        paddingRight: 12,
    },
    sendButton: {
        backgroundColor: '#0A84FF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginLeft: 8,
        shadowColor: '#0A84FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    sendButtonDisabled: {
        backgroundColor: 'rgba(10, 132, 255, 0.3)',
        shadowOpacity: 0,
        elevation: 0,
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
        fontFamily: 'exo',
    },
});

export default PromptScreen;