import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface ChecklistItemProps {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  loading?: boolean;
}

export function ChecklistItem({ label, description, checked, onToggle, loading }: ChecklistItemProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.iconContainer}>
        {checked ? (
          <Feather name="check-circle" size={20} color="#22C55E" />
        ) : (
          <Feather name="circle" size={20} color={colors.mutedForeground} />
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
      <View style={styles.actionContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <TouchableOpacity onPress={onToggle} style={styles.touchArea}>
            <Feather name={checked ? "x" : "check"} size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
  },
  actionContainer: {
    marginLeft: 12,
    width: 24,
    alignItems: "center",
  },
  touchArea: {
    padding: 4,
  },
});
