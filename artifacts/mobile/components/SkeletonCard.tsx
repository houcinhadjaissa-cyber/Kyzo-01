import React, { useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useColors } from "@/hooks/useColors";

export function SkeletonCard() {
  const colors = useColors();
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, opacity }]}>
      <View style={[styles.line, { width: "40%", backgroundColor: colors.muted }]} />
      <View style={[styles.line, { width: "80%", backgroundColor: colors.muted }]} />
      <View style={[styles.line, { width: "60%", backgroundColor: colors.muted }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  line: {
    height: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
});