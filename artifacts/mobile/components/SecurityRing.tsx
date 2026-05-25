import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

export function SecurityRing({ score, size = 40 }: { score: number; size?: number }) {
  const colors = useColors();
  
  let color = colors.destructive;
  if (score > 90) {
    color = "#22C55E";
  } else if (score > 70) {
    color = "#F59E0B";
  }

  return (
    <View style={[styles.container, { width: size, height: size, borderColor: `${color}40`, borderWidth: 4, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { color: colors.foreground, fontSize: size * 0.35 }]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "bold",
  },
});