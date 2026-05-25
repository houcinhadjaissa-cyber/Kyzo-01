import React from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, Platform, TouchableOpacity, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useListDeployments } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { SkeletonCard } from "@/components/SkeletonCard";
import { Feather } from "@expo/vector-icons";

export default function DeploymentsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? Math.max(insets.top, 67) : insets.top;

  const { data: deployments, isLoading, refetch, isRefetching } = useListDeployments();

  const handleOpenUrl = (url?: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Deployments</Text>
      </View>

      {isLoading ? (
        <View style={styles.listContainer}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={deployments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="cloud" size={32} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
              <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>No deployments yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={styles.cardHeader}>
                <View style={styles.providerRow}>
                  <View style={[styles.providerIcon, { backgroundColor: colors.muted }]}>
                    <Feather name="box" size={14} color={colors.foreground} />
                  </View>
                  <Text style={[styles.providerText, { color: colors.foreground }]}>
                    {item.provider.charAt(0).toUpperCase() + item.provider.slice(1)}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Project ID:</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.projectId.slice(0, 8)}...</Text>
              </View>

              {item.duration && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Duration:</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.duration}s</Text>
                </View>
              )}

              {item.url && (
                <TouchableOpacity 
                  style={[styles.urlButton, { backgroundColor: colors.muted }]} 
                  onPress={() => handleOpenUrl(item.url)}
                >
                  <Feather name="external-link" size={14} color={colors.primary} />
                  <Text style={[styles.urlText, { color: colors.primary }]}>{item.url}</Text>
                </TouchableOpacity>
              )}

              <View style={styles.footer}>
                <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
                {item.branch && (
                  <View style={styles.branchTag}>
                    <Feather name="git-branch" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.branchText, { color: colors.mutedForeground }]}>{item.branch}</Text>
                  </View>
                )}
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
    marginBottom: 16,
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  providerIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  providerText: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  urlButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
  },
  urlText: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333", // fallback
  },
  timeText: {
    fontSize: 12,
  },
  branchTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  branchText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
});