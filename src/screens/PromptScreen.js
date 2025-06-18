import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import generateGPTQuestion from '../gptService';
import checkAnswer from '../checkAnswer';

const PromptScreen = ({ navigation }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef(null);

  /* ───────────────────────────────── Keyboard show/hide ───────────────────────────────── */
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' },
      });
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.4)',
          borderTopRightRadius: 20,
          borderTopLeftRadius: 20,
          paddingVertical: 4,
          paddingHorizontal: 8,
          height: 65,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 12,
          position: 'absolute',
        },
      });
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [navigation]);

  /* ─────────────────────────── Auto-scroll when messages change ─────────────────────────── */
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  /* ───────────────────────────────────── Send handler ───────────────────────────────────── */
  const handleSend = async () => {
    const trimmedPrompt = prompt.trim(); // remove leading/trailing whitespace + newlines

    if (!trimmedPrompt) return; // nothing to send if it's empty after trimming

    // add user message
    setMessages(prev => [...prev, { text: trimmedPrompt, type: 'user' }]);
    setPrompt(''); // clear input field

    try {
      const result = await generateGPTQuestion(trimmedPrompt);
      const gptResponse = result.choices[0].message.content;
      setMessages(prev => [...prev, { text: gptResponse, type: 'gpt' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { text: 'Sorry, something went wrong. Please try again.', type: 'gpt' },
      ]);
    }
  };

  /* ────────────────────────────────────── Render ────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AskGPT</Text>
      </View>

      {/* Chat */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={[
          styles.chatContent,
          { paddingBottom: isKeyboardVisible ? 120 : 180 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Start a conversation with AI</Text>
            <Text style={styles.emptyStateSubtext}>Ask me anything and I'll help you learn!</Text>
          </View>
        ) : (
          messages.map((msg, idx) => (
            <View
              key={idx}
              style={[
                styles.messageBubble,
                msg.type === 'user' ? styles.userBubble : styles.gptBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  msg.type === 'user' ? styles.userText : styles.gptText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Composer */}
      <View
        style={[
          styles.inputContainer,
          { bottom: isKeyboardVisible ? 0 : 65 },
        ]}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Type your message..."
            value={prompt}
            onChangeText={setPrompt}
            style={styles.input}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[
              styles.sendButton,
              !prompt.trim() && styles.sendButtonDisabled,
            ]}
            disabled={!prompt.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

/* ─────────────────────────────────── Styles (unchanged) ─────────────────────────────────── */
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
    flexGrow: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
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