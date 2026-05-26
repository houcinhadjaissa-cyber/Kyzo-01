import React, { useEffect, useRef } from "react";
import { Animated, ActivityIndicator, TouchableOpacity, View, Text, StyleSheet } from "react-native";

export default function StreamingCursor({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [anim]);

  return <Animated.Text style={{ color, opacity: anim, fontSize: 16 }}>|</Animated.Text>;
}
