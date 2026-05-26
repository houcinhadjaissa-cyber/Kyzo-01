import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import StreamingCursor from "@/components/StreamingCursor";
import * as Haptics from "expo-haptics";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

function startStream(projectId: string, prompt: string, taskType: string, convId: string | undefined, callbacks: {
  onStart: (data: {model: string; modelName: string; reason: string}) => void;
  onConversation: (id: string) => void;
  onChunk: (text: string) => void;
  onDone: (data: {tokensUsed: number; model: string}) => void;
  onError: (msg: string) => void;
}): (() => void) {
  const BASE = process.env.EXPO_PUBLIC_DOMAIN ? 'https://' + process.env.EXPO_PUBLIC_DOMAIN : '';
  const params = new URLSearchParams({ prompt, taskType });
  if (convId) params.set('conversationId', convId);
  const url = BASE + '/api/projects/' + projectId + '/ai/stream?' + params.toString();
  
  if (Platform.OS === 'web' && typeof EventSource !== 'undefined') {
    const es = new EventSource(url);
    es.addEventListener('start', (e: any) => callbacks.onStart(JSON.parse(e.data)));
    es.addEventListener('conversation', (e: any) => callbacks.onConversation(JSON.parse(e.data).conversationId));
    es.addEventListener('chunk', (e: any) => callbacks.onChunk(JSON.parse(e.data).text));
    es.addEventListener('done', (e: any) => { callbacks.onDone(JSON.parse(e.data)); es.close(); });
    es.addEventListener('error', () => { callbacks.onError('Connection error'); es.close(); });
    return () => es.close();
  } else {
    fetch(BASE + '/api/projects/' + projectId + '/ai/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: prompt, taskType, conversationId: convId }),
    })
      .then(r => r.json())
      .then((data: any) => {
        callbacks.onChunk(data.assistantMessage.content);
        callbacks.onDone({ tokensUsed: data.tokensUsed, model: data.modelUsed });
        if (data.conversationId) callbacks.onConversation(data.conversationId);
      })
      .catch(() => callbacks.onError('Request failed'));
    return () => {};
  }
}

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  tokensUsed?: number;
  streaming?: boolean;
};

const TASK_TYPES = [
  { id: 'general', label: 'General' },
  { id: 'code_generation', label: 'Code Gen' },
  { id: 'ui_styling', label: 'UI Design' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'security_audit', label: 'Security' },
  { id: 'debugging', label: 'Debug' }
];

export default function BuilderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? Math.max(insets.top, 67) : Math.max(insets.top, 12);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [taskType, setTaskType] = useState('general');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentModel, setCurrentModel] = useState<{modelId: string, modelName: string, reason: string} | null>(null);

  const stopFnRef = useRef<() => void>();
  const flatListRef = useRef<FlatList>(null);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();
    
    setMessages(prev => [
      { id: userMsgId, role: 'user', content: text },
      { id: assistantMsgId, role: 'assistant', content: '', streaming: true },
      ...prev
    ]);
    setInputText("");
    setIsStreaming(true);
    setCurrentModel(null);

    const stopFn = startStream(id as string, text, taskType, conversationId, {
      onStart: (data) => setCurrentModel({ modelId: data.model, modelName: data.modelName, reason: data.reason }),
      onConversation: (convId) => setConversationId(convId),
      onChunk: (chunkText) => {
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: m.content + chunkText } : m));
      },
      onDone: (data) => {
        setIsStreaming(false);
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, streaming: false, tokensUsed: data.tokensUsed, modelUsed: data.model } : m));
      },
      onError: (msg) => {
        setIsStreaming(false);
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, streaming: false, content: m.content + `\n\n[Error: ${msg}]` } : m));
      }
    });
    stopFnRef.current = stopFn;
  };

  const handleStop = () => {
    if (stopFnRef.current) stopFnRef.current();
    setIsStreaming(false);
    setMessages(prev => prev.map(m => m.streaming ? { ...m, streaming: false } : m));
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
        <View style={[styles.messageBubble, isUser ? [styles.bubbleUser, { backgroundColor: colors.primary }] : [styles.bubbleAssistant, { backgroundColor: colors.card, borderColor: colors.border }]]}>
          <Text style={[styles.messageText, isUser ? { color: "#FFFFFF" } : { color: colors.foreground, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>
            {item.content}
            {item.streaming && <StreamingCursor color={colors.primary} />}
          </Text>
          {item.modelUsed && item.tokensUsed && !item.streaming && (
            <Text style={[styles.messageFooter, { color: colors.mutedForeground }]}>
              {item.modelUsed} · {item.tokensUsed} tokens
            </Text>
          )}
        </View>
      </View>
    );
  };

  const promptExamples = [
    "Build a landing page with contact form",
    "Add Stripe payments to my app",
    "Fix the authentication bug",
    "Audit my app for security issues"
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Builder</Text>
        <View style={[styles.modelBadge, { backgroundColor: colors.primary + '20' }]}>
          <Feather name="cpu" size={12} color={colors.primary} />
          <Text style={[styles.modelBadgeText, { color: colors.primary }]}>AIOS</Text>
        </View>
      </View>

      <View style={[styles.chipsContainer, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {TASK_TYPES.map(tt => (
            <TouchableOpacity 
              key={tt.id} 
              style={[styles.chip, taskType === tt.id ? { backgroundColor: colors.primary } : { backgroundColor: colors.muted }]}
              onPress={() => { if (!isWeb) Haptics.selectionAsync(); setTaskType(tt.id); }}
            >
              <Text style={[styles.chipText, taskType === tt.id ? { color: "#FFF" } : { color: colors.mutedForeground }]}>{tt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {currentModel && (
        <View style={[styles.modelInfoBar, { backgroundColor: colors.card }]}>
          <Feather name="zap" size={12} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={[styles.modelInfoText, { color: colors.mutedForeground }]}>
            Routing to {currentModel.modelName} — {currentModel.reason}
          </Text>
        </View>
      )}

      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="layers" size={48} color={colors.muted} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyHeading, { color: colors.foreground }]}>What do you want to build?</Text>
          <View style={styles.promptChips}>
            {promptExamples.map((p, i) => (
              <TouchableOpacity key={i} style={[styles.promptChip, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setInputText(p)}>
                <Text style={[styles.promptChipText, { color: colors.foreground }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          inverted
          keyboardShouldPersistTaps="handled"
        />
      )}

      <KeyboardAvoidingView behavior="padding" style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Describe what you want to build..."
            placeholderTextColor={colors.mutedForeground}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          {isStreaming ? (
            <TouchableOpacity style={styles.sendBtn} onPress={handleStop}>
              <Feather name="square" size={20} color={colors.destructive} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend(inputText)} disabled={!inputText.trim()}>
              <Feather name="send" size={20} color={inputText.trim() ? colors.primary : colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', flex: 1 },
  modelBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  modelBadgeText: { fontSize: 12, fontWeight: '600' },
  chipsContainer: { borderBottomWidth: 1, paddingVertical: 8 },
  chipsScroll: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  chipText: { fontSize: 13, fontWeight: '500' },
  modelInfoBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, justifyContent: 'center' },
  modelInfoText: { fontSize: 12 },
  messagesList: { padding: 16, gap: 16 },
  messageRow: { flexDirection: 'row', width: '100%' },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAssistant: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '85%', padding: 12, borderRadius: 16 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: { borderWidth: 1, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  messageFooter: { fontSize: 10, marginTop: 8, textAlign: 'right' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyHeading: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  promptChips: { width: '100%', gap: 12 },
  promptChip: { padding: 16, borderRadius: 12, borderWidth: 1 },
  promptChipText: { fontSize: 14, textAlign: 'center' },
  inputContainer: { padding: 12, borderTopWidth: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  input: { flex: 1, minHeight: 40, maxHeight: 120, paddingTop: 10, paddingBottom: 10, fontSize: 16 },
  sendBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginLeft: 8, marginBottom: 2 }
});
