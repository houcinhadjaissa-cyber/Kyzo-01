import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { ActivityEvent } from "@workspace/api-client-react";

export function ActivityItem({ event }: { event: ActivityEvent }) {
  const colors = useColors();

  let iconName: keyof typeof Feather.glyphMap = "activity";
  let iconColor = colors.primary;

  switch (event.type) {
    case "project_created":
      iconName = "plus-circle";
      break;
    case "project_generated":
      iconName = "cpu";
      iconColor = colors.accent;
      break;
    case "deployment_started":
      iconName = "upload-cloud";
      iconColor = "#F59E0B";
      break;
    case "deployment_live":
      iconName = "check-circle";
      iconColor = "#22C55E";
      break;
    case "scan_completed":
      iconName = "shield";
      iconColor = colors.destructive;
      break;
    case "workflow_run":
      iconName = "play-circle";
      break;
    case "model_switched":
      iconName = "layers";
      break;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Feather name={iconName} size={16} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.summary, { color: colors.foreground }]}>{event.summary}</Text>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>
          {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  summary: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
  },
});