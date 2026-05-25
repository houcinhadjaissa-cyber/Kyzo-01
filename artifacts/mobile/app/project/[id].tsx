import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useGetProject, useGenerateProject, useScanProject, useDeployProject } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { SecurityRing } from "@/components/SecurityRing";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const isWeb = Platform.OS === "web";

  const { data: project, isLoading, refetch } = useGetProject(id as string);
  const generateProject = useGenerateProject();
  const scanProject = useScanProject();
  const deployProject = useDeployProject();

  const handleGenerate = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    generateProject.mutate({ id: id as string, data: { prompt: project?.prompt || "" } }, {
      onSuccess: () => refetch()
    });
  };

  const handleScan = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scanProject.mutate({ id: id as string }, {
      onSuccess: () => refetch()
    });
  };

  const handleDeploy = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deployProject.mutate({ id: id as string, data: { provider: "vercel" } }, {
      onSuccess: () => refetch()
    });
  };

  if (isLoading || !project) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.mutedForeground }}>Loading telemetry...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>{project.name}</Text>
          <StatusBadge status={project.status} />
        </View>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {project.description || project.prompt}
        </Text>
        
        {project.tech && project.tech.length > 0 && (
          <View style={styles.techChips}>
            {project.tech.map(t => (
              <View key={t} style={[styles.chip, { backgroundColor: colors.muted }]}>
                <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{t}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.actionsGrid}>
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
          onPress={handleGenerate}
          disabled={generateProject.isPending}
        >
          <View style={[styles.actionIcon, { backgroundColor: `${colors.accent}20` }]}>
            <Feather name="cpu" size={24} color={colors.accent} />
          </View>
          <Text style={[styles.actionTitle, { color: colors.foreground }]}>Generate</Text>
          <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>AI code gen</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
          onPress={handleScan}
          disabled={scanProject.isPending}
        >
          <View style={[styles.actionIcon, { backgroundColor: `${colors.destructive}20` }]}>
            <Feather name="shield" size={24} color={colors.destructive} />
          </View>
          <Text style={[styles.actionTitle, { color: colors.foreground }]}>Security</Text>
          <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>Run audit</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
          onPress={handleDeploy}
          disabled={deployProject.isPending}
        >
          <View style={[styles.actionIcon, { backgroundColor: `#F59E0B20` }]}>
            <Feather name="upload-cloud" size={24} color="#F59E0B" />
          </View>
          <Text style={[styles.actionTitle, { color: colors.foreground }]}>Deploy</Text>
          <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>To edge</Text>
        </TouchableOpacity>
      </View>

      {project.securityScore !== undefined && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Security Posture</Text>
          <View style={styles.securityRow}>
            <SecurityRing score={project.securityScore} size={64} />
            <View style={styles.securityTextInfo}>
              <Text style={[styles.securityLabel, { color: colors.foreground }]}>System Scan Complete</Text>
              <Text style={[styles.securitySub, { color: colors.mutedForeground }]}>Last checked {new Date().toLocaleDateString()}</Text>
            </View>
          </View>
        </View>
      )}

      {project.deployedUrl && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Live Deployment</Text>
          <View style={[styles.urlBox, { backgroundColor: colors.muted }]}>
            <Feather name="link" size={16} color={colors.primary} />
            <Text style={[styles.urlText, { color: colors.primary }]}>{project.deployedUrl}</Text>
          </View>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    flex: 1,
    marginRight: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  techChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  actionSub: {
    fontSize: 12,
  },
  section: {
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  securityTextInfo: {
    flex: 1,
  },
  securityLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  securitySub: {
    fontSize: 14,
  },
  urlBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  urlText: {
    fontSize: 14,
    fontWeight: "500",
  },
});