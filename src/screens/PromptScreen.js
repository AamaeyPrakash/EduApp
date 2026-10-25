import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import Banner from '../components/Banner';
import MathText from '../components/MathText';
import PrimaryButton from '../components/PrimaryButton';
import config from '../config';
import { getBoardLabel } from '../constants/educationBoards';
import { getErrorMessage, isUnauthorizedError } from '../lib/errors';
import { openLink } from '../lib/links';
import {
  askTutor,
  isTutorConfigured,
  MAX_MESSAGE_LENGTH,
  reportTutorReply,
} from '../services/ai';
import { colors } from '../theme';

// Shown once before the first question: App Store guideline 5.1.2(i) requires telling
// people what is sent to a third-party AI service, and asking first.
function AiConsent({ onAgree }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const agree = async () => {
    setSaving(true);
    setError(null);
    try {
      await onAgree();
    } catch (agreeError) {
      setError(
        getErrorMessage(
          agreeError,
          "We couldn't save your choice. Please try again.",
        ),
      );
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.consent}>
      <Text style={styles.consentTitle} accessibilityRole="header">
        Before you start
      </Text>
      <Text style={styles.consentText}>
        AskGPT answers your questions using OpenAI, an AI service. To do that,
        EduApp sends OpenAI:
      </Text>
      <Text style={styles.consentBullet}>
        • the messages you type in this chat
      </Text>
      <Text style={styles.consentBullet}>
        • your education board and grade, so answers match your syllabus
      </Text>
      <Text style={styles.consentText}>
        Please don't include personal details such as your full name, address or
        phone number in your messages. AI answers can contain mistakes, so check
        important results.
      </Text>
      {config.privacyPolicyUrl ? (
        <Text
          style={styles.consentLink}
          accessibilityRole="link"
          onPress={() => openLink(config.privacyPolicyUrl)}
        >
          Read our Privacy Policy
        </Text>
      ) : null}
      <Banner message={error} />
      <PrimaryButton title="I Agree" onPress={agree} loading={saving} />
    </ScrollView>
  );
}

const PromptScreen = () => {
  const { profile, verifySession, hasAiConsent, grantAiConsent } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const nextId = useRef(0);
  const tutorReady = isTutorConfigured();

  // Lets the tutor pitch answers at the student's curriculum and grade.
  const student = useMemo(
    () =>
      profile
        ? {
            board: getBoardLabel(profile.educationBoard),
            grade: String(profile.grade ?? ''),
          }
        : undefined,
    [profile],
  );

  const addMessage = (role, content, extra = {}) => {
    nextId.current += 1;
    const message = { id: String(nextId.current), role, content, ...extra };
    setMessages(current => [...current, message]);
    return message;
  };

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text || sending || !tutorReady) {
      return;
    }
    const conversation = messages.filter(message => message.role !== 'error');
    const userMessage = addMessage('user', text);
    setPrompt('');
    setSending(true);
    try {
      const reply = await askTutor({
        messages: [...conversation, userMessage],
        student,
      });
      addMessage('assistant', reply, { question: text });
    } catch (error) {
      if (isUnauthorizedError(error) && !(await verifySession())) {
        return; // The session ended; the app returns to the sign-in screen.
      }
      addMessage(
        'error',
        getErrorMessage(
          error,
          'Sorry, something went wrong. Please try again.',
        ),
      );
    } finally {
      setSending(false);
    }
  };

  const submitReport = async message => {
    try {
      await reportTutorReply({
        question: message.question,
        reply: message.content,
      });
      setMessages(current =>
        current.map(item =>
          item.id === message.id ? { ...item, reported: true } : item,
        ),
      );
    } catch (error) {
      if (isUnauthorizedError(error) && !(await verifySession())) {
        return;
      }
      Alert.alert(
        "Couldn't send your report",
        getErrorMessage(error, 'Please try again.'),
      );
    }
  };

  // Google Play requires a way to report AI-generated content from inside the app.
  const handleReport = message =>
    Alert.alert(
      'Report this answer?',
      'Tell us if this answer was inappropriate or wrong. We review reports to improve the tutor.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => submitReport(message),
        },
      ],
    );

  const renderMessage = ({ item }) => {
    if (item.role === 'user') {
      return (
        <View style={[styles.messageBubble, styles.userBubble]}>
          <Text style={[styles.messageText, styles.userText]} selectable>
            {item.content}
          </Text>
        </View>
      );
    }
    if (item.role === 'error') {
      return (
        <View style={[styles.messageBubble, styles.errorBubble]}>
          <Text style={[styles.messageText, styles.errorText]}>
            {item.content}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.assistantMessage}>
        <View style={[styles.messageBubble, styles.gptBubble]}>
          <MathText content={item.content} />
        </View>
        <TouchableOpacity
          onPress={() => handleReport(item)}
          disabled={item.reported}
          style={styles.reportButton}
          accessibilityRole="button"
          accessibilityLabel={
            item.reported ? 'Answer reported' : 'Report this answer'
          }
          hitSlop={8}
        >
          <Text style={styles.reportText}>
            {item.reported ? 'Reported - thank you' : 'Report'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const canSend = tutorReady && !sending && prompt.trim().length > 0;
  const needsConsent = tutorReady && !hasAiConsent;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            AskGPT
          </Text>
          {messages.length > 0 && !sending ? (
            <TouchableOpacity
              onPress={() => setMessages([])}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={styles.newChat}>New chat</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {needsConsent ? (
          <AiConsent onAgree={grantAiConsent} />
        ) : (
          <>
            <FlatList
              ref={listRef}
              style={styles.flex}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.chatContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({ animated: true })
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Start a conversation with AI
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Ask me anything and I'll help you learn!
                  </Text>
                  {tutorReady ? null : (
                    <Banner
                      style={styles.setupBanner}
                      tone="info"
                      message="The AI tutor isn't set up yet. Please check back soon."
                    />
                  )}
                </View>
              }
              ListFooterComponent={
                sending ? (
                  <View
                    style={[
                      styles.messageBubble,
                      styles.gptBubble,
                      styles.typing,
                    ]}
                  >
                    <ActivityIndicator color={colors.textMuted} size="small" />
                    <Text style={styles.typingText}>Thinking...</Text>
                  </View>
                ) : null
              }
            />

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Type your message..."
                  value={prompt}
                  onChangeText={setPrompt}
                  style={styles.input}
                  placeholderTextColor={colors.placeholder}
                  keyboardAppearance="dark"
                  multiline
                  maxLength={MAX_MESSAGE_LENGTH}
                  editable={tutorReady}
                  returnKeyType="send"
                  submitBehavior="submit"
                  onSubmitEditing={handleSend}
                  accessibilityLabel="Message"
                />
                <TouchableOpacity
                  onPress={handleSend}
                  style={[
                    styles.sendButton,
                    !canSend && styles.sendButtonDisabled,
                  ]}
                  disabled={!canSend}
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  newChat: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  consent: {
    padding: 24,
  },
  consentTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  consentText: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  consentBullet: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.text,
    marginBottom: 8,
    paddingLeft: 8,
  },
  consentLink: {
    color: colors.primary,
    fontSize: 15,
    textDecorationLine: 'underline',
    marginBottom: 20,
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
    color: colors.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  setupBanner: {
    marginTop: 24,
  },
  messageBubble: {
    padding: 16,
    borderRadius: 20,
    marginVertical: 6,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 8,
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  gptBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderBottomLeftRadius: 8,
  },
  reportButton: {
    marginLeft: 12,
    marginBottom: 4,
  },
  reportText: {
    color: colors.textFaint,
    fontSize: 12,
  },
  errorBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.dangerSurface,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderBottomLeftRadius: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: colors.text,
    fontWeight: '500',
  },
  errorText: {
    color: colors.danger,
  },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    color: colors.textMuted,
    fontSize: 15,
    marginLeft: 10,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.tabBar,
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
    color: colors.text,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
    paddingRight: 12,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(10, 132, 255, 0.3)',
  },
  sendButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
});

export default PromptScreen;
