import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

export function StatusBadge({ status }: { status: string }) {
  const colors = useColors();
  
  let backgroundColor = colors.muted;
  let textColor = colors.mutedForeground;

  switch (status) {
    case "generating":
      backgroundColor = `${colors.accent}20`;
      textColor = colors.accent;
      break;
    case "deployed":
    case "success":
    case "live":
      backgroundColor = "#22C55E20";
      textColor = "#22C55E";
      break;
    case "error":
    case "failed":
    case "cancelled":
      backgroundColor = `${colors.destructive}20`;
      textColor = colors.destructive;
      break;
    case "ready":
      backgroundColor = `${colors.primary}20`;
      textColor = colors.primary;
      break;
    case "deploying":
    case "running":
    case "building":
      backgroundColor = "#F59E0B20";
      textColor = "#F59E0B";
      break;
    case "idle":
    case "queued":
      backgroundColor = colors.muted;
      textColor = colors.mutedForeground;
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor, borderRadius: 12 }]}>
      <Text style={[styles.text, { color: textColor }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
