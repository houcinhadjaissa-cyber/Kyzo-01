import React from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGetDashboard } from "@workspace/api-client-react";
import { ActivityItem } from "@/components/ActivityItem";
import { SkeletonCard } from "@/components/SkeletonCard";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

function StatTile({ title, value, icon, color }: { title: string, value: string | number, icon: keyof typeof Feather.glyphMap, color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statTile, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={styles.statHeader}>
        <Feather name={icon} size={16} color={color} />
        <Text style={[styles.statTitle, { color: colors.mutedForeground }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? Math.max(insets.top, 67) : insets.top;

  const { data: dashboard, isLoading, refetch, isRefetching } = useGetDashboard();

  const handleNewProject = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/project/new");
  };

  const handleRunScan = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Placeholder action for Run Scan
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <LinearGradient
          colors={[`${colors.primary}20`, "transparent"]}
          style={styles.heroGradient}
        >
          <Text style={[styles.greeting, { color: colors.foreground }]}>Command Center</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>All systems operational.</Text>
        </LinearGradient>

        {isLoading ? (
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={styles.gridItem}>
                <SkeletonCard />
              </View>
            ))}
          </View>
        ) : dashboard ? (
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <StatTile title="Total Projects" value={dashboard.totalProjects} icon="layers" color={colors.primary} />
            </View>
            <View style={styles.gridItem}>
              <StatTile title="Live" value={dashboard.liveProjects} icon="activity" color="#22C55E" />
            </View>
            <View style={styles.gridItem}>
              <StatTile title="Deployments" value={dashboard.totalDeployments} icon="upload-cloud" color="#F59E0B" />
            </View>
            <View style={styles.gridItem}>
              <StatTile title="Workflows" value={dashboard.activeWorkflows} icon="zap" color={colors.accent} />
            </View>
            <View style={styles.gridItem}>
              <StatTile title="Security Score" value={`${dashboard.avgSecurityScore}%`} icon="shield" color={dashboard.avgSecurityScore > 90 ? "#22C55E" : dashboard.avgSecurityScore > 70 ? "#F59E0B" : colors.destructive} />
            </View>
            <View style={styles.gridItem}>
              <StatTile title="Today's Cost" value={`$${dashboard.costToday.toFixed(2)}`} icon="dollar-sign" color="#10B981" />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
          {isLoading ? (
            <View><SkeletonCard /><SkeletonCard /></View>
          ) : dashboard?.recentActivity?.length ? (
            dashboard.recentActivity.map(event => (
              <ActivityItem key={event.id} event={event} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Feather name="clock" size={24} color={colors.mutedForeground} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.mutedForeground }}>No recent activity.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.fabContainer}>
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleRunScan}>
          <Feather name="shield" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, styles.fabPrimary, { backgroundColor: colors.primary }]} onPress={handleNewProject}>
          <Feather name="plus" size={20} color="#FFF" />
          <Text style={styles.fabText}>New Project</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroGradient: {
    padding: 24,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: -16,
  },
  gridItem: {
    width: "50%",
    padding: 8,
  },
  statTile: {
    padding: 16,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  fabContainer: {
    position: "absolute",
    bottom: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  fab: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingHorizontal: 16,
    marginLeft: 12,
  },
  fabPrimary: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderWidth: 0,
  },
  fabText: {
    color: "#FFF",
    fontWeight: "600",
    marginLeft: 8,
  },
});