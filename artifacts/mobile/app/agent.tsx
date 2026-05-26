import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import {
  useGetAgentStatus,
  useGetAgentFixes,
  usePostAgentScan,
  usePostAgentPause,
  usePostAgentResume,
  usePostAgentFixesIdApprove,
} from "@workspace/api-client-react";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#F59E0B",
  low: "#22C55E",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  detected: { label: "Detected", color: "#F59E0B" },
  researching: { label: "Researching…", color: "#6366F1" },
  applied: { label: "Applied", color: "#22C55E" },
  verified: { label: "Verified ✓", color: "#10B981" },
  failed: { label: "Failed", color: "#EF4444" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AgentScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? Math.max(insets.top, 67) : insets.top;

  const { data: status, isLoading: statusLoading, refetch: refetchStatus, isRefetching } = useGetAgentStatus();
  const { data: fixes, isLoading: fixesLoading, refetch: refetchFixes } = useGetAgentFixes();
  const scanMutation = usePostAgentScan();
  const pauseMutation = usePostAgentPause();
  const resumeMutation = usePostAgentResume();
  const approveMutation = usePostAgentFixesIdApprove();

  const refetchAll = () => { refetchStatus(); refetchFixes(); };

  const handleScan = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scanMutation.mutate(undefined as any, { onSuccess: () => setTimeout(refetchAll, 1000) });
  };

  const handleToggle = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (status?.mode === "active") {
      pauseMutation.mutate(undefined as any, { onSuccess: () => { refetchStatus(); } });
    } else {
      resumeMutation.mutate(undefined as any, { onSuccess: () => { refetchStatus(); } });
    }
  };

  const handleApprove = (id: string) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    approveMutation.mutate({ id }, { onSuccess: refetchAll });
  };

  const isActive = status?.mode === "active";
  const pendingFixes = fixes?.filter((f: any) => f.status === "researching" || f.status === "detected") ?? [];
  const completedFixes = fixes?.filter((f: any) => f.status === "applied" || f.status === "verified") ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetchAll} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Self-Healing Agent</Text>
        </View>

        {!statusLoading && status && (
          <LinearGradient
            colors={isActive ? [`${colors.primary}20`, `${colors.accent}10`] : [`${colors.muted}40`, "transparent"]}
            style={[styles.statusCard, { borderColor: isActive ? `${colors.primary}40` : colors.border, borderRadius: colors.radius }]}
          >
            <View style={styles.statusTop}>
              <View style={styles.statusLeft}>
                <View style={[styles.pulse, { backgroundColor: isActive ? "#22C55E" : colors.mutedForeground }]} />
                <View>
                  <Text style={[styles.statusLabel, { color: colors.foreground }]}>
                    {isActive ? "Agent Active" : "Agent Paused"}
                  </Text>
                  <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>
                    {isActive ? `Health: ${status.health}` : "Tap Resume to re-activate"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleToggle}
                style={[styles.toggleBtn, { backgroundColor: isActive ? colors.muted : colors.primary }]}
              >
                <Text style={[styles.toggleText, { color: isActive ? colors.mutedForeground : "#FFF" }]}>
                  {isActive ? "Pause" : "Resume"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statVal, { color: colors.foreground }]}>{status.totalFixesApplied}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Fixes Applied</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statVal, { color: colors.foreground }]}>{status.totalIssuesDetected}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Issues Detected</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statVal, { color: colors.foreground }]}>{status.uptime}%</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Uptime</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleScan}
              disabled={scanMutation.isPending || status.isScanning}
              style={[styles.scanBtn, { backgroundColor: colors.primary, opacity: scanMutation.isPending ? 0.7 : 1 }]}
            >
              <Feather name="search" size={16} color="#FFF" />
              <Text style={styles.scanBtnText}>
                {status.isScanning ? "Scanning…" : "Run Full Scan Now"}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {pendingFixes.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Needs Attention</Text>
            {pendingFixes.map((fix: any) => (
              <View key={fix.id} style={[styles.fixCard, { backgroundColor: colors.card, borderColor: `${SEVERITY_COLORS[fix.severity] ?? colors.border}40`, borderRadius: colors.radius }]}>
                <View style={styles.fixHeader}>
                  <View style={[styles.severityTag, { backgroundColor: `${SEVERITY_COLORS[fix.severity] ?? colors.border}18` }]}>
                    <Text style={[styles.severityText, { color: SEVERITY_COLORS[fix.severity] ?? colors.mutedForeground }]}>
                      {fix.severity.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.fixStatus, { color: STATUS_LABELS[fix.status]?.color ?? colors.mutedForeground }]}>
                    {STATUS_LABELS[fix.status]?.label}
                  </Text>
                </View>
                <Text style={[styles.fixTitle, { color: colors.foreground }]}>{fix.issue}</Text>
                <Text style={[styles.fixDesc, { color: colors.mutedForeground }]}>{fix.description}</Text>
                {fix.solution && (
                  <View style={[styles.solutionBox, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}20` }]}>
                    <Feather name="tool" size={12} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.solutionText, { color: colors.primary }]} numberOfLines={2}>{fix.solution}</Text>
                  </View>
                )}
                {!fix.autoApplied && fix.status !== "applied" && (
                  <TouchableOpacity onPress={() => handleApprove(fix.id)} style={[styles.approveBtn, { backgroundColor: colors.primary }]}>
                    <Feather name="check" size={14} color="#FFF" />
                    <Text style={styles.approveBtnText}>Approve & Apply</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {completedFixes.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Auto-Healed</Text>
            {completedFixes.map((fix: any) => (
              <View key={fix.id} style={[styles.fixCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, opacity: 0.8 }]}>
                <View style={styles.fixHeader}>
                  <View style={[styles.severityTag, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.severityText, { color: colors.mutedForeground }]}>{fix.severity.toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.fixStatus, { color: "#22C55E" }]}>
                    {STATUS_LABELS[fix.status]?.label}
                  </Text>
                </View>
                <Text style={[styles.fixTitle, { color: colors.foreground }]}>{fix.issue}</Text>
                <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                  Fixed {timeAgo(fix.resolvedAt ?? fix.createdAt)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {!fixesLoading && (pendingFixes.length === 0 && completedFixes.length === 0) && (
          <View style={styles.emptyState}>
            <Feather name="shield" size={40} color="#22C55E" style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All Clear</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>No issues detected. Run a scan to check.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  statusCard: {
    margin: 20,
    padding: 20,
    borderWidth: 1,
  },
  statusTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  pulse: { width: 12, height: 12, borderRadius: 6 },
  statusLabel: { fontSize: 16, fontWeight: "600" },
  statusSub: { fontSize: 12, marginTop: 2 },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleText: { fontSize: 13, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  stat: { alignItems: "center" },
  statVal: { fontSize: 22, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 4 },
  statDivider: { width: 1 },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scanBtnText: { color: "#FFF", fontWeight: "600" },
  section: { paddingHorizontal: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  fixCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  fixHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  severityTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  severityText: { fontSize: 10, fontWeight: "700" },
  fixStatus: { fontSize: 12, fontWeight: "600" },
  fixTitle: { fontSize: 15, fontWeight: "600", marginBottom: 6 },
  fixDesc: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  solutionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  solutionText: { fontSize: 12, flex: 1, lineHeight: 16 },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  approveBtnText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
  timeText: { fontSize: 11, marginTop: 4 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  emptyBody: { fontSize: 14, textAlign: "center" },
});
