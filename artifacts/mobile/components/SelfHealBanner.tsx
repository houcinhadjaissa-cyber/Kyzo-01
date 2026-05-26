import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useGetAgentStatus, useGetAgentFixes } from "@workspace/api-client-react";

export function SelfHealBanner() {
  const colors = useColors();
  const router = useRouter();
  const isWeb = Platform.OS === "web";

  const { data: status } = useGetAgentStatus();
  const { data: fixes } = useGetAgentFixes();

  const pendingCount = fixes?.filter((f: any) => f.status === "researching" || f.status === "detected").length ?? 0;

  const handlePress = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/agent");
  };

  if (!status) return null;

  if (pendingCount > 0) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.banner, { backgroundColor: `${colors.destructive}15`, borderColor: `${colors.destructive}30` }]}
        activeOpacity={0.8}
      >
        <View style={[styles.dot, { backgroundColor: colors.destructive }]} />
        <Text style={[styles.text, { color: colors.foreground }]}>
          <Text style={{ color: colors.destructive, fontWeight: "700" }}>Agent found {pendingCount} issue{pendingCount > 1 ? "s" : ""}</Text>
          {" — tap to review"}
        </Text>
        <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
      </TouchableOpacity>
    );
  }

  if (status.mode === "active") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.banner, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}20` }]}
        activeOpacity={0.8}
      >
        <View style={[styles.dot, { backgroundColor: "#22C55E" }]} />
        <Text style={[styles.text, { color: colors.mutedForeground }]}>
          {"AIOS self-healed "}
          <Text style={{ color: colors.foreground, fontWeight: "600" }}>{status.totalFixesApplied} issues</Text>
          {" — all systems nominal"}
        </Text>
        <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
      </TouchableOpacity>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  text: { flex: 1, fontSize: 13 },
});
