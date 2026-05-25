import React from "react";
import { View, Text, StyleSheet, FlatList, Platform } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useListModels } from "@workspace/api-client-react";
import { SkeletonCard } from "@/components/SkeletonCard";
import { Feather } from "@expo/vector-icons";

export default function ModelsScreen() {
  const colors = useColors();
  const { data: models, isLoading } = useListModels();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "fast": return "#10B981";
      case "powerful": return colors.primary;
      case "balanced": return "#F59E0B";
      default: return colors.mutedForeground;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={styles.listContainer}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={models}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={styles.header}>
                <View>
                  <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.provider, { color: colors.mutedForeground }]}>{item.provider}</Text>
                </View>
                <View style={[styles.tierBadge, { backgroundColor: `${getTierColor(item.tier)}20` }]}>
                  <Text style={[styles.tierText, { color: getTierColor(item.tier) }]}>{item.tier.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Feather name="maximize-2" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.statText, { color: colors.mutedForeground }]}>{(item.contextWindow / 1000)}k context</Text>
                </View>
                {item.costPer1kTokens !== undefined && (
                  <View style={styles.stat}>
                    <Feather name="dollar-sign" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.statText, { color: colors.mutedForeground }]}>${item.costPer1kTokens}/1k</Text>
                  </View>
                )}
              </View>

              {item.capabilities && item.capabilities.length > 0 && (
                <View style={styles.capsRow}>
                  {item.capabilities.map(cap => (
                    <View key={cap} style={[styles.capChip, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.capText, { color: colors.foreground }]}>{cap}</Text>
                    </View>
                  ))}
                </View>
              )}
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
  listContainer: {
    padding: 20,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  provider: {
    fontSize: 14,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 12,
  },
  capsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  capChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  capText: {
    fontSize: 12,
    fontWeight: "500",
  },
});