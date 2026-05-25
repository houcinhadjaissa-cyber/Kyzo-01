import React from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, Platform, TouchableOpacity, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useListWorkflows, useRunWorkflow } from "@workspace/api-client-react";
import { SkeletonCard } from "@/components/SkeletonCard";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function WorkflowsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? Math.max(insets.top, 67) : insets.top;

  const { data: workflows, isLoading, refetch, isRefetching } = useListWorkflows();
  const runWorkflow = useRunWorkflow();

  const handleRun = (id: string) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    runWorkflow.mutate({ id });
  };

  const getTriggerIcon = (trigger: string): keyof typeof Feather.glyphMap => {
    switch (trigger) {
      case "schedule": return "clock";
      case "webhook": return "link";
      case "event": return "activity";
      default: return "play-circle";
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Workflows</Text>
      </View>

      {isLoading ? (
        <View style={styles.listContainer}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={workflows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="zap" size={32} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
              <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>No workflows available.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                  <View style={[styles.iconBox, { backgroundColor: colors.muted }]}>
                    <Feather name={getTriggerIcon(item.trigger)} size={16} color={colors.foreground} />
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.name}</Text>
                </View>
                <Switch
                  value={item.enabled}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor={colors.foreground}
                  onValueChange={() => {}}
                />
              </View>

              {item.description && (
                <Text style={[styles.description, { color: colors.mutedForeground }]}>{item.description}</Text>
              )}

              <View style={styles.footer}>
                <View style={styles.statsRow}>
                  <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>{item.steps} steps</Text>
                  </View>
                  
                  {item.lastRunStatus && (
                    <View style={styles.statusRow}>
                      <View style={[styles.dot, { backgroundColor: item.lastRunStatus === 'success' ? '#22C55E' : item.lastRunStatus === 'failed' ? colors.destructive : '#F59E0B' }]} />
                      <Text style={[styles.statusText, { color: colors.mutedForeground }]}>{item.lastRunStatus}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                  style={[styles.runButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleRun(item.id)}
                  disabled={runWorkflow.isPending || !item.enabled}
                >
                  <Feather name="play" size={14} color="#FFF" />
                  <Text style={styles.runButtonText}>Run</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  runButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  runButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
});