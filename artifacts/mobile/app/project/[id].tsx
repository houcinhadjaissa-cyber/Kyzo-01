import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useGetProject, useGenerateProject, useScanProject, useDeployProject } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { SecurityRing } from "@/components/SecurityRing";
import { ChecklistItem } from "@/components/ChecklistItem";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const isWeb = Platform.OS === "web";
  const BASE = process.env.EXPO_PUBLIC_DOMAIN ? 'https://' + process.env.EXPO_PUBLIC_DOMAIN : '';

  const { data: project, isLoading, refetch } = useGetProject(id as string);
  const generateProject = useGenerateProject();
  const scanProject = useScanProject();
  const deployProject = useDeployProject();

  const [checklist, setChecklist] = useState<any[]>([]);
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(BASE + `/api/projects/${id}/checklist`)
      .then(r => r.json())
      .then(data => setChecklist(data))
      .catch(() => {});
  }, [id, BASE]);

  const handleToggleChecklist = (itemKey: string, currentValue: boolean) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggling(prev => ({ ...prev, [itemKey]: true }));
    fetch(BASE + `/api/projects/${id}/checklist/${itemKey}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: !currentValue })
    })
      .then(r => r.json())
      .then(data => {
        setChecklist(data);
        setToggling(prev => ({ ...prev, [itemKey]: false }));
      })
      .catch(() => {
        setToggling(prev => ({ ...prev, [itemKey]: false }));
      });
  };

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

  const checklistScore = checklist.length ? Math.round((checklist.filter(c => c.checked).length / checklist.length) * 100) : 0;

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

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 1.5, borderRadius: colors.radius }]}
          onPress={() => { if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push(`/builder/${id}`); }}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
            <Feather name="message-circle" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.actionTitle, { color: colors.foreground }]}>AI Builder</Text>
          <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>Continue building</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.versionLink, { borderColor: colors.border }]}
        onPress={() => router.push(`/project/versions?id=${id}`)}
      >
        <Feather name="git-branch" size={16} color={colors.mutedForeground} />
        <Text style={[styles.versionLinkText, { color: colors.mutedForeground }]}>View Version History</Text>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>

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

      {checklist.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.checklistHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>Security Checklist</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>{checklistScore}%</Text>
          </View>
          
          <View style={[styles.progressBarBg, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressBarFill, { backgroundColor: checklistScore === 100 ? "#22C55E" : colors.primary, width: `${checklistScore}%` }]} />
          </View>

          {checklistScore === 100 ? (
            <View style={[styles.banner, { backgroundColor: "#22C55E20", borderColor: "#22C55E" }]}>
              <Feather name="check-circle" size={16} color="#22C55E" />
              <Text style={[styles.bannerText, { color: "#22C55E" }]}>Ready to deploy</Text>
            </View>
          ) : (
            <View style={[styles.banner, { backgroundColor: `${colors.destructive}20`, borderColor: colors.destructive }]}>
              <Feather name="alert-triangle" size={16} color={colors.destructive} />
              <Text style={[styles.bannerText, { color: colors.destructive }]}>Deploy blocked</Text>
            </View>
          )}

          <View style={styles.checklistItems}>
            {checklist.map(item => (
              <ChecklistItem 
                key={item.itemKey}
                label={item.label}
                description={item.description}
                checked={item.checked}
                loading={toggling[item.itemKey]}
                onToggle={() => handleToggleChecklist(item.itemKey, item.checked)}
              />
            ))}
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
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    width: '48%',
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 12,
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
  versionLink: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 24,
  },
  versionLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 12,
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
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  checklistItems: {
    marginTop: 8,
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