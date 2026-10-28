import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  TextInput,
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
import {
  continuous,
  gutter,
  makeStyles,
  radius,
  type,
  useTheme,
} from '../theme';
import AppText from './AppText';
import Banner from './Banner';
import Button from './Button';
import Chip from './Chip';
import Glass from './Glass';
import Icon from './Icon';
import { IconTile } from './List';
import MathText from './MathText';
import PressableScale from './PressableScale';

function useKeyboardShown() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const showing = Keyboard.addListener('keyboardDidShow', () =>
      setShown(true),
    );
    const hiding = Keyboard.addListener('keyboardDidHide', () =>
      setShown(false),
    );
    return () => {
      showing.remove();
      hiding.remove();
    };
  }, []);
  return shown;
}

function ConsentPoint({ icon, children }) {
  const styles = useStyles();
  return (
    <View style={styles.point}>
      <Icon name={icon} size={20} color="tint" />
      <AppText variant="body" style={styles.pointText}>
        {children}
      </AppText>
    </View>
  );
}

// Shown once before the first question: App Store guideline 5.1.2(i) requires telling
// people what is sent to a third-party AI service, and asking first.
function AiConsent({ onAgree }) {
  const styles = useStyles();
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
      <IconTile name="sparkles" color="purple" size={56} />
      <AppText
        variant="title1"
        accessibilityRole="header"
        style={styles.consentTitle}
      >
        Before you start
      </AppText>
      <AppText variant="body" color="secondaryLabel" style={styles.consentText}>
        The tutor answers using OpenAI, an AI service. To do that, EduApp sends
        OpenAI:
      </AppText>
      <ConsentPoint icon="compose">
        the messages you type in the chat
      </ConsentPoint>
      <ConsentPoint icon="graduation">
        your education board and grade, so answers match your syllabus
      </ConsentPoint>
      <ConsentPoint icon="book">
        the practice question you are working on, when you ask about one
      </ConsentPoint>
      <AppText
        variant="subheadline"
        color="secondaryLabel"
        style={styles.consentText}
      >
        Please don't include personal details such as your full name, address or
        phone number in your messages. AI answers can contain mistakes, so check
        important results.
      </AppText>
      {config.privacyPolicyUrl ? (
        <AppText
          variant="subheadline"
          color="tint"
          accessibilityRole="link"
          onPress={() => openLink(config.privacyPolicyUrl)}
          style={styles.consentLink}
        >
          Read our Privacy Policy
        </AppText>
      ) : null}
      <Banner message={error} />
      <Button title="I Agree" onPress={agree} loading={saving} />
    </ScrollView>
  );
}

// The AI tutor conversation.
//   question       a practice question; the tutor then knows it and its official
//                  solution, and guides with hints instead of answering outright
//   suggestions    [{ label, text, icon, send }] starters; `send: false` puts the text
//                  in the message box to finish instead of sending it. Shown as cards
//                  in the empty chat, or as chips above the message box with
//                  `chips` (always for a question)
//   renderHeader   ({ hasMessages, clear, sending }) => header element
//   bottomInset    space to keep below the message box (e.g. for the tab bar)
//   pendingPrompt  a message to send once the chat is ready (e.g. "summarise this
//                  topic"); onPendingSent is called after it's sent
export default function TutorChat({
  question,
  suggestions = [],
  emptyTitle = 'How can I help?',
  emptySubtitle = 'Ask about any maths topic, or pick a starting point.',
  renderHeader,
  bottomInset = 0,
  pendingPrompt,
  onPendingSent,
  chips = Boolean(question),
}) {
  const styles = useStyles();
  const theme = useTheme();
  const { profile, verifySession, hasAiConsent, grantAiConsent } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  // The list keeps this much space at the end so the newest message isn't hidden
  // behind the message box floating over it.
  const [dockHeight, setDockHeight] = useState(chips ? 112 : 60);
  const listRef = useRef(null);
  const listHeight = useRef(0);
  const inputRef = useRef(null);
  const nextId = useRef(0);
  const keyboardShown = useKeyboardShown();
  const tutorReady = isTutorConfigured();
  const needsConsent = tutorReady && !hasAiConsent;

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
      AccessibilityInfo.announceForAccessibility('The tutor replied.');
    } catch (error) {
      if (isUnauthorizedError(error) && !(await verifySession())) {
        return; // The session ended; the app returns to the sign-in screen.
      }
      const message = getErrorMessage(
        error,
        'Sorry, something went wrong. Please try again.',
      );
      setMessages(current => [...current, createMessage('error', message)]);
      AccessibilityInfo.announceForAccessibility(message);
    } finally {
      setSending(false);
    }
  };

  const send = text => {
    const trimmed = text.trim();
    if (!trimmed || sending || !tutorReady) {
      return false;
    }
    const conversation = [
      ...messages.filter(message => message.role !== 'error'),
      createMessage('user', trimmed),
    ];
    setMessages(conversation);
    setPrompt('');
    requestReply(conversation);
    return true;
  };

  // Sends a message handed over by another screen once consent is in place.
  const sendRef = useRef(send);
  sendRef.current = send;
  useEffect(() => {
    if (pendingPrompt && !needsConsent && sendRef.current(pendingPrompt)) {
      onPendingSent?.();
    }
    // `sending` is here so a prompt that arrives mid-reply goes out afterwards.
  }, [pendingPrompt, needsConsent, onPendingSent, sending]);

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

  const submitReport = async message => {
    try {
      await reportTutorReply({
        question: message.question,
        reply: message.content,
        // Which practice question the chat was about, for whoever reviews it.
        context: question
          ? `${question.course} · ${question.topic}: ${question.text}`
          : undefined,
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

  const header = renderHeader?.({
    hasMessages: messages.length > 0,
    clear: () => setMessages([]),
    sending,
  });

  if (needsConsent) {
    return (
      <>
        {header}
        <AiConsent onAgree={grantAiConsent} />
      </>
    );
  }

  const lastMessage = messages[messages.length - 1];
  const renderMessage = ({ item }) => {
    if (item.role === 'user') {
      return (
        <View style={[styles.bubble, styles.userBubble]}>
          <AppText variant="body" color="onTint" selectable>
            {item.content}
          </AppText>
        </View>
      );
    }
    if (item.role === 'error') {
      return (
        <View style={[styles.bubble, styles.errorBubble]}>
          <AppText variant="subheadline">{item.content}</AppText>
          {item === lastMessage && !sending ? (
            <Button
              title="Try again"
              icon="retry"
              variant="plain"
              size="small"
              onPress={retry}
              style={styles.retry}
            />
          ) : null}
        </View>
      );
    }
    return (
      <View style={styles.assistant}>
        <View style={[styles.bubble, styles.assistantBubble]}>
          <MathText content={item.content} />
        </View>
        <Pressable
          onPress={() => handleReport(item)}
          disabled={item.reported}
          accessibilityRole="button"
          accessibilityLabel={
            item.reported ? 'Answer reported' : 'Report this answer'
          }
          hitSlop={6}
          style={styles.report}
        >
          <AppText variant="caption" color="secondaryLabel">
            {item.reported ? 'Reported - thank you' : 'Report'}
          </AppText>
        </Pressable>
      </View>
    );
  };

  const canSend = tutorReady && !sending && prompt.trim().length > 0;
  const dockBottom = keyboardShown ? 8 : bottomInset;
  const charactersLeft = MAX_MESSAGE_LENGTH - prompt.length;

  return (
    <View style={styles.flex}>
      {header}
      <FlatList
        ref={listRef}
        style={styles.flex}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chat}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onLayout={event => {
          listHeight.current = event.nativeEvent.layout.height;
        }}
        // Scrolls by the measured content height: scrollToEnd works from cached item
        // sizes that lag behind replies whose maths has just been drawn.
        onContentSizeChange={(width, height) =>
          listRef.current?.scrollToOffset({
            offset: Math.max(0, height - listHeight.current),
            animated: true,
          })
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText variant="title2" align="center">
              {emptyTitle}
            </AppText>
            <AppText
              variant="subheadline"
              color="secondaryLabel"
              align="center"
              style={styles.emptySubtitle}
            >
              {emptySubtitle}
            </AppText>
            {tutorReady ? (
              question ? null : (
                <View style={styles.cards}>
                  {suggestions.map(item => (
                    <PressableScale
                      key={item.label}
                      style={styles.cardWrap}
                      onPress={() => pickSuggestion(item)}
                      accessibilityRole="button"
                    >
                      <View style={styles.card}>
                        <Icon name={item.icon} size={22} color="tint" />
                        <AppText
                          variant="subheadline"
                          weight="600"
                          style={styles.cardLabel}
                        >
                          {item.label}
                        </AppText>
                      </View>
                    </PressableScale>
                  ))}
                </View>
              )
            ) : (
              <Banner
                tone="info"
                style={styles.setup}
                message="The AI tutor isn't set up yet. Please check back soon."
              />
            )}
          </View>
        }
        ListFooterComponent={
          <>
            {sending ? (
              <View
                style={[styles.bubble, styles.assistantBubble, styles.typing]}
              >
                <ActivityIndicator
                  color={theme.colors.secondaryLabel}
                  size="small"
                />
                <AppText
                  variant="subheadline"
                  color="secondaryLabel"
                  style={styles.typingText}
                >
                  Thinking...
                </AppText>
              </View>
            ) : null}
            <View style={{ height: dockBottom + dockHeight + 12 }} />
          </>
        }
      />

      <View
        style={[styles.dock, { bottom: dockBottom }]}
        pointerEvents="box-none"
        onLayout={event => setDockHeight(event.nativeEvent.layout.height)}
      >
        {chips && tutorReady ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.chips}
          >
            {suggestions.map(item => (
              <Chip
                key={item.label}
                label={item.label}
                icon={item.icon}
                glass
                disabled={sending}
                onPress={() => pickSuggestion(item)}
              />
            ))}
          </ScrollView>
        ) : null}
        {charactersLeft <= 100 ? (
          <AppText
            variant="caption"
            color={charactersLeft <= 0 ? 'red' : 'secondaryLabel'}
            align="right"
            style={styles.counter}
            accessibilityLiveRegion="polite"
          >
            {charactersLeft <= 0
              ? 'Message limit reached'
              : `${charactersLeft} characters left`}
          </AppText>
        ) : null}
        <Glass style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            placeholder="Message"
            value={prompt}
            onChangeText={setPrompt}
            style={styles.input}
            placeholderTextColor={theme.colors.placeholder}
            selectionColor={theme.colors.tint}
            keyboardAppearance={theme.dark ? 'dark' : 'light'}
            multiline
            maxLength={MAX_MESSAGE_LENGTH}
            editable={tutorReady}
            returnKeyType="send"
            submitBehavior="submit"
            onSubmitEditing={() => send(prompt)}
            accessibilityLabel="Message"
          />
          <PressableScale
            onPress={() => send(prompt)}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            hitSlop={6}
            style={[styles.send, canSend ? styles.sendActive : styles.sendIdle]}
          >
            <Icon
              name="arrowUp"
              size={18}
              color={canSend ? 'onTint' : 'secondaryLabel'}
              strokeWidth={2.6}
            />
          </PressableScale>
        </Glass>
      </View>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  flex: {
    flex: 1,
  },
  consent: {
    padding: gutter + 8,
    paddingBottom: 140,
  },
  consentTitle: {
    marginTop: 20,
    marginBottom: 8,
  },
  consentText: {
    marginVertical: 8,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  pointText: {
    flex: 1,
    marginLeft: 12,
  },
  consentLink: {
    marginBottom: 20,
  },
  chat: {
    paddingHorizontal: gutter,
    paddingTop: 8,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptySubtitle: {
    marginTop: 6,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 24,
  },
  cardWrap: {
    width: '48%',
    flexGrow: 1,
  },
  card: {
    ...continuous,
    backgroundColor: theme.colors.surface,
    borderRadius: radius.card,
    padding: 14,
    minHeight: 92,
    justifyContent: 'space-between',
  },
  cardLabel: {
    marginTop: 12,
  },
  setup: {
    marginTop: 24,
  },
  bubble: {
    ...continuous,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    backgroundColor: theme.colors.tint,
    borderBottomRightRadius: 6,
  },
  assistant: {
    alignItems: 'flex-start',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    maxWidth: '94%',
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 6,
  },
  report: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 2,
  },
  errorBubble: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
    backgroundColor: theme.colors.redFill,
  },
  retry: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: -14,
  },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: 10,
  },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  chips: {
    gap: 8,
    paddingHorizontal: gutter,
    paddingTop: 4,
    paddingBottom: 10,
  },
  counter: {
    marginHorizontal: gutter + 8,
    marginBottom: 6,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: gutter,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 26,
  },
  input: {
    ...type.body,
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    paddingTop: 10,
    paddingBottom: 10,
    color: theme.colors.label,
  },
  send: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginBottom: 1,
  },
  sendActive: {
    backgroundColor: theme.colors.tint,
  },
  sendIdle: {
    backgroundColor: theme.colors.fill,
  },
}));
