import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  useGetNotifications,
  usePatchNotificationsIdRead,
  usePostNotificationsReadAll,
  useDeleteNotificationsId,
} from "@workspace/api-client-react";
import type { Notification } from "@workspace/api-client-react";

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  generation_complete: { icon: "cpu", color: "#6366F1" },
  generation_failed: { icon: "alert-circle", color: "#EF4444" },
  deployment_live: { icon: "upload-cloud", color: "#22C55E" },
  deployment_failed: { icon: "cloud-off", color: "#EF4444" },
  scan_complete: { icon: "shield", color: "#06B6D4" },
  scan_critical: { icon: "alert-triangle", color: "#F59E0B" },
  agent_fix: { icon: "tool", color: "#8B5CF6" },
  billing: { icon: "dollar-sign", color: "#10B981" },
  system: { icon: "info", color: "#8B92B8" },
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

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? Math.max(insets.top, 67) : insets.top;

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications, isLoading, refetch, isRefetching } = useGetNotifications(
    filter === "unread" ? { unreadOnly: "true" } : undefined
  );

  const markRead = usePatchNotificationsIdRead();
  const markAllRead = usePostNotificationsReadAll();
  const deleteNotif = useDeleteNotificationsId();

  const handleMarkRead = (id: string) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markRead.mutate({ id }, { onSuccess: () => refetch() });
  };

  const handleMarkAllRead = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markAllRead.mutate(undefined as any, { onSuccess: () => refetch() });
  };

  const handleDelete = (id: string) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    deleteNotif.mutate({ id }, { onSuccess: () => refetch() });
  };

  const handlePress = (item: Notification) => {
    if (!item.read) handleMarkRead(item.id);
    if (item.deepLink) router.push(item.deepLink as any);
  };

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {(["all", "unread"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filter === f ? colors.primary : colors.card,
                borderColor: filter === f ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.filterText, { color: filter === f ? "#FFF" : colors.mutedForeground }]}>
              {f === "all" ? "All" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={notifications ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyState}>
              <Feather name="bell-off" size={40} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All caught up</Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>No notifications yet.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const iconInfo = TYPE_ICONS[item.type] ?? TYPE_ICONS["system"]!;
          return (
            <TouchableOpacity
              onPress={() => handlePress(item)}
              style={[
                styles.card,
                {
                  backgroundColor: item.read ? colors.card : `${colors.primary}12`,
                  borderColor: item.read ? colors.border : `${colors.primary}40`,
                  borderRadius: colors.radius,
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${iconInfo.color}18` }]}>
                <Feather name={iconInfo.icon as any} size={18} color={iconInfo.color} />
              </View>

              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text style={[styles.notifTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                </View>
                <Text style={[styles.notifBody, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {item.body}
                </Text>
                <View style={styles.metaRow}>
                  {item.projectName && (
                    <View style={[styles.projectPill, { backgroundColor: colors.muted }]}>
                      <Feather name="layers" size={10} color={colors.mutedForeground} />
                      <Text style={[styles.projectPillText, { color: colors.mutedForeground }]}>{item.projectName}</Text>
                    </View>
                  )}
                  <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{timeAgo(item.createdAt)}</Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 22, fontWeight: "700", flex: 1 },
  markAllBtn: { paddingHorizontal: 8 },
  markAllText: { fontSize: 14, fontWeight: "600" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: "600" },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  content: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 6, flexShrink: 0 },
  notifBody: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  projectPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  projectPillText: { fontSize: 11, fontWeight: "500" },
  timeText: { fontSize: 11 },
  deleteBtn: { padding: 4, marginLeft: 4 },
  emptyState: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  emptyBody: { fontSize: 14 },
});
