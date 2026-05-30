import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Platform, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
}

function SettingRow({ icon, label, value, onPress, trailing, danger }: SettingRowProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? "#EF44441A" : colors.muted }]}>
        <Feather name={icon as any} size={16} color={danger ? "#EF4444" : colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: danger ? "#EF4444" : colors.foreground }]}>{label}</Text>
        {value ? <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text> : null}
      </View>
      {trailing ?? (onPress && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />)}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{title}</Text>;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const topPadding = isWeb ? Math.max(insets.top, 67) : insets.top;

  const [pushEnabled, setPushEnabled] = useState(true);
  const [autoHeal, setAutoHeal] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  const handleToggle = (setter: (v: boolean) => void, val: boolean) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(val);
  };

  const handleClearCache = () => {
    if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Clear Cache", "Local cache cleared. Data will re-sync on next load.", [{ text: "OK" }]);
  };

  const handleExportData = () => {
    Alert.alert("Export Data", "A JSON export of your projects and settings will be available shortly.", [{ text: "OK" }]);
  };

  const toggleStyle = (val: boolean) => ({
    trackColor: { false: colors.muted, true: colors.primary },
    thumbColor: "#FFF",
    value: val,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>AIOS User</Text>
            <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>Pro Plan · Active</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/upgrade")} style={[styles.planBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.planBadgeText}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        <SectionHeader title="NOTIFICATIONS" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <SettingRow
            icon="bell"
            label="Push Notifications"
            trailing={
              <Switch
                {...toggleStyle(pushEnabled)}
                onValueChange={(v) => handleToggle(setPushEnabled, v)}
              />
            }
          />
          <SettingRow
            icon="cpu"
            label="Auto-Heal Alerts"
            trailing={
              <Switch
                {...toggleStyle(autoHeal)}
                onValueChange={(v) => handleToggle(setAutoHeal, v)}
              />
            }
          />
        </View>

        <SectionHeader title="AI AGENT" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <SettingRow icon="box" label="AI Models" value="3 active" onPress={() => router.push("/models")} />
          <SettingRow icon="sliders" label="Generation Quality" value="Balanced" onPress={() => {}} />
          <SettingRow icon="shield" label="Agent Mode" value="Self-Healing" onPress={() => router.push("/agent")} />
          <SettingRow icon="activity" label="Usage & Billing" value="View stats" onPress={() => router.push("/upgrade")} />
        </View>

        <SectionHeader title="DISPLAY" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <SettingRow
            icon="layout"
            label="Compact Mode"
            trailing={
              <Switch
                {...toggleStyle(compactMode)}
                onValueChange={(v) => handleToggle(setCompactMode, v)}
              />
            }
          />
          <SettingRow icon="moon" label="Theme" value="System (Dark)" onPress={() => {}} />
          <SettingRow icon="globe" label="Language" value="English" onPress={() => {}} />
        </View>

        <SectionHeader title="PRIVACY & DATA" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <SettingRow
            icon="bar-chart-2"
            label="Anonymous Analytics"
            trailing={
              <Switch
                {...toggleStyle(analyticsEnabled)}
                onValueChange={(v) => handleToggle(setAnalyticsEnabled, v)}
              />
            }
          />
          <SettingRow icon="download" label="Export My Data" onPress={handleExportData} />
          <SettingRow icon="trash-2" label="Clear Local Cache" onPress={handleClearCache} />
        </View>

        <SectionHeader title="ABOUT" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <SettingRow icon="info" label="Version" value="1.0.0 (build 42)" />
          <SettingRow icon="file-text" label="Terms of Service" onPress={() => {}} />
          <SettingRow icon="lock" label="Privacy Policy" onPress={() => {}} />
          <SettingRow icon="github" label="Open Source Licenses" onPress={() => {}} />
        </View>

        <SectionHeader title="DANGER ZONE" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <SettingRow
            icon="log-out"
            label="Sign Out"
            danger
            onPress={() => Alert.alert("Sign Out", "Are you sure?", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign Out", style: "destructive", onPress: () => {} },
            ])}
          />
          <SettingRow
            icon="alert-triangle"
            label="Delete Account"
            danger
            onPress={() => Alert.alert("Delete Account", "This will permanently delete all your data. This cannot be undone.", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => {} },
            ])}
          />
        </View>

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          AIOS v1.0.0 · Built with ❤️ on Replit
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 20, fontWeight: "700" },
  scroll: { paddingBottom: 60 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    padding: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: "700" },
  profileEmail: { fontSize: 13, marginTop: 2 },
  planBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  planBadgeText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 6,
  },
  card: { marginHorizontal: 16, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15 },
  rowValue: { fontSize: 12, marginTop: 1 },
  footer: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 32,
    marginBottom: 8,
  },
});
