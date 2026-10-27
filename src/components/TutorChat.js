import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
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
import Banner from './Banner';
import MathText from './MathText';
import PrimaryButton from './PrimaryButton';

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
      <Text style={styles.consentBullet}>
        • the practice question you are working on, when you ask about one
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

// Tappable starters. `send: false` puts the text in the box to finish typing instead.
function Suggestions({ items, onPick, disabled }) {
  if (!items || items.length === 0) {
    return null;
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.suggestions}
    >
      {items.map(item => (
        <TouchableOpacity
          key={item.label}
          style={[styles.suggestion, disabled && styles.suggestionDisabled]}
          onPress={() => onPick(item)}
          disabled={disabled}
          accessibilityRole="button"
        >
          <Text style={styles.suggestionText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// The AI tutor conversation. With `question` (a practice question), the tutor knows
// the question and its official solution, and guides with hints instead of answering
// outright. `suggestions` are [{ label, text, send }].
export default function TutorChat({
  question,
  suggestions,
  emptyTitle = 'Start a conversation with AI',
  emptySubtitle = "Ask me anything and I'll help you learn!",
  onClear,
}) {
  const { profile, verifySession, hasAiConsent, grantAiConsent } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
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

  const createMessage = (role, content, extra = {}) => {
    nextId.current += 1;
    return { id: String(nextId.current), role, content, ...extra };
  };

  const requestReply = async conversation => {
    setSending(true);
    try {
      const reply = await askTutor({
        messages: conversation,
        student,
        question,
      });
      const asked = conversation[conversation.length - 1].content;
      setMessages(current => [
        ...current,
        createMessage('assistant', reply, { question: asked }),
      ]);
    } catch (error) {
      if (isUnauthorizedError(error) && !(await verifySession())) {
        return; // The session ended; the app returns to the sign-in screen.
      }
      setMessages(current => [
        ...current,
        createMessage(
          'error',
          getErrorMessage(
            error,
            'Sorry, something went wrong. Please try again.',
          ),
        ),
      ]);
    } finally {
      setSending(false);
    }
  };

  const send = text => {
    const trimmed = text.trim();
    if (!trimmed || sending || !tutorReady) {
      return;
    }
    const conversation = [
      ...messages.filter(message => message.role !== 'error'),
      createMessage('user', trimmed),
    ];
    setMessages(conversation);
    setPrompt('');
    requestReply(conversation);
  };

  // Sends the last question again after a failed attempt.
  const retry = () => {
    if (sending) {
      return;
    }
    const conversation = messages.filter(message => message.role !== 'error');
    if (conversation[conversation.length - 1]?.role !== 'user') {
      return;
    }
    setMessages(conversation);
    requestReply(conversation);
  };

  const pickSuggestion = item => {
    if (item.send === false) {
      setPrompt(item.text);
      inputRef.current?.focus();
    } else {
      send(item.text);
    }
  };

  const clear = () => {
    setMessages([]);
    onClear?.();
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

  const lastMessage = messages[messages.length - 1];

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
          {item === lastMessage && !sending ? (
            <TouchableOpacity
              onPress={retry}
              accessibilityRole="button"
              style={styles.retryButton}
              hitSlop={8}
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          ) : null}
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

  if (tutorReady && !hasAiConsent) {
    return <AiConsent onAgree={grantAiConsent} />;
  }

  const canSend = tutorReady && !sending && prompt.trim().length > 0;

  return (
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
            <Text style={styles.emptyStateText}>{emptyTitle}</Text>
            <Text style={styles.emptyStateSubtext}>{emptySubtitle}</Text>
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
              style={[styles.messageBubble, styles.gptBubble, styles.typing]}
            >
              <ActivityIndicator color={colors.textMuted} size="small" />
              <Text style={styles.typingText}>Thinking...</Text>
            </View>
          ) : null
        }
      />

      <View style={styles.inputContainer}>
        {tutorReady ? (
          <Suggestions
            items={suggestions}
            onPick={pickSuggestion}
            disabled={sending}
          />
        ) : null}
        {messages.length > 0 && !sending ? (
          <TouchableOpacity
            onPress={clear}
            accessibilityRole="button"
            style={styles.newChat}
            hitSlop={8}
          >
            <Text style={styles.newChatText}>New chat</Text>
          </TouchableOpacity>
        ) : null}
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
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
            onSubmitEditing={() => send(prompt)}
            accessibilityLabel="Message"
          />
          <TouchableOpacity
            onPress={() => send(prompt)}
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
    textAlign: 'center',
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
  retryButton: {
    marginTop: 10,
  },
  retryText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
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
    paddingVertical: 12,
    backgroundColor: colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestions: {
    gap: 8,
    paddingBottom: 10,
  },
  suggestion: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.5)',
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionDisabled: {
    opacity: 0.5,
  },
  suggestionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  newChat: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  newChatText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
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
