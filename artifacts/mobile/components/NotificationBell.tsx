import React from "react";
import { TouchableOpacity, View, Text, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useGetNotificationsUnreadCount } from "@workspace/api-client-react";

export function NotificationBell() {
  const colors = useColors();
  const router = useRouter();
  const isWeb = Platform.OS === "web";

  const { data } = useGetNotificationsUnreadCount();
  const unread = data?.count ?? 0;

  const handlePress = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/notifications");
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Feather name="bell" size={22} color={colors.foreground} />
      {unread > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
          <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
