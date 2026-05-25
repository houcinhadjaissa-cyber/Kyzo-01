import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useCreateProject } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

export default function NewProjectScreen() {
  const colors = useColors();
  const router = useRouter();
  const createProject = useCreateProject();
  const isWeb = Platform.OS === "web";

  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("gpt-4o");

  const models = [
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "claude-3.5-sonnet", label: "Claude 3.5" },
    { id: "gemini-1.5-pro", label: "Gemini 1.5" }
  ];

  const handleCreate = () => {
    if (!name || !prompt) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    createProject.mutate({ data: { name, prompt, tech: [] } }, {
      onSuccess: (data) => {
        router.replace(`/project/${data.id}`);
      }
    });
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Initialize Spacecraft</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Define your next mission parameters.</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Project Designation</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            placeholder="e.g. Apollo CRM"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>AI Model</Text>
          <View style={styles.chipRow}>
            {models.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.chip,
                  { backgroundColor: model === m.id ? colors.primary : colors.muted }
                ]}
                onPress={() => setModel(m.id)}
              >
                <Text style={[styles.chipText, { color: model === m.id ? "#FFF" : colors.mutedForeground }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.formGroup, styles.flex]}>
          <Text style={[styles.label, { color: colors.foreground }]}>Mission Prompt</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Describe the application you want to build in detail..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            textAlignVertical="top"
            value={prompt}
            onChangeText={setPrompt}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreate}
          disabled={!name || !prompt || createProject.isPending}
        >
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {createProject.isPending ? (
              <Text style={styles.buttonText}>Initializing...</Text>
            ) : (
              <>
                <Feather name="zap" size={18} color="#FFF" />
                <Text style={styles.buttonText}>CREATE</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    flexGrow: 1,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  flex: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  chipRow: {
    flexDirection: "row",
    gap: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chipText: {
    fontWeight: "600",
    fontSize: 14,
  },
  textarea: {
    flex: 1,
    minHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  createButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    gap: 8,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});