import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, Platform, TouchableOpacity, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useListProjects } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { SecurityRing } from "@/components/SecurityRing";
import { SkeletonCard } from "@/components/SkeletonCard";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? Math.max(insets.top, 67) : insets.top;

  const { data: projects, isLoading, refetch, isRefetching } = useListProjects();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = projects?.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Projects</Text>
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search projects..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.listContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="layers" size={32} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
              <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>No projects found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
              onPress={() => router.push(`/project/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.name}</Text>
                  <StatusBadge status={item.status} />
                </View>
                {item.securityScore !== undefined && (
                  <SecurityRing score={item.securityScore} size={36} />
                )}
              </View>
              
              {item.tech && item.tech.length > 0 && (
                <View style={styles.chipsRow}>
                  {item.tech.slice(0, 4).map(t => (
                    <View key={t} style={[styles.chip, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{t}</Text>
                    </View>
                  ))}
                  {item.tech.length > 4 && (
                    <View style={[styles.chip, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.chipText, { color: colors.mutedForeground }]}>+{item.tech.length - 4}</Text>
                    </View>
                  )}
                </View>
              )}
              
              <View style={styles.cardFooter}>
                <Feather name="clock" size={12} color={colors.mutedForeground} />
                <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                  Updated {new Date(item.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
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
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
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
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    marginLeft: 6,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
});