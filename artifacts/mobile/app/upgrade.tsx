import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useGetSubscription, useGetSubscriptionPlans, usePostSubscriptionUpgrade } from "@workspace/api-client-react";

const PLAN_ICONS: Record<string, string> = {
  free: "gift",
  pro: "zap",
  enterprise: "star",
};

const PLAN_GRADIENT: Record<string, [string, string]> = {
  free: ["#1A1E3C", "#1A1E3C"],
  pro: ["#4F46E5", "#7C3AED"],
  enterprise: ["#0891B2", "#0E7490"],
};

export default function UpgradeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? Math.max(insets.top, 67) : insets.top;

  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const { data: subscription, refetch } = useGetSubscription();
  const { data: plans } = useGetSubscriptionPlans();
  const upgradeMutation = usePostSubscriptionUpgrade();

  const handleUpgrade = (plan: string) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUpgrading(plan);
    upgradeMutation.mutate(
      { data: { plan: plan as any } },
      {
        onSuccess: (data: any) => {
          setUpgrading(null);
          refetch();
          if (data?.checkoutUrl) Linking.openURL(data.checkoutUrl);
        },
        onError: () => setUpgrading(null),
      },
    );
  };

  const getPrice = (basePrice: number) => {
    if (billing === "yearly") return Math.floor(basePrice * 0.8);
    return basePrice;
  };

  const usagePct = subscription
    ? Math.round((subscription.usage.aiTokensUsed / subscription.usage.aiTokensLimit) * 100)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Plans & Billing</Text>
        </View>

        {subscription && (
          <View style={[styles.currentPlanCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.currentPlanLabel, { color: colors.mutedForeground }]}>Current Plan</Text>
            <Text style={[styles.currentPlanName, { color: colors.foreground }]}>
              {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
            </Text>

            <View style={styles.usageBlock}>
              <View style={styles.usageRow}>
                <Text style={[styles.usageLabel, { color: colors.mutedForeground }]}>AI Tokens</Text>
                <Text style={[styles.usageVal, { color: colors.foreground }]}>
                  {(subscription.usage.aiTokensUsed / 1000).toFixed(1)}K / {(subscription.usage.aiTokensLimit / 1000).toFixed(0)}K
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(usagePct, 100)}%` as any,
                      backgroundColor: usagePct > 80 ? colors.destructive : colors.primary,
                    },
                  ]}
                />
              </View>

              <View style={styles.usageRow}>
                <Text style={[styles.usageLabel, { color: colors.mutedForeground }]}>Projects</Text>
                <Text style={[styles.usageVal, { color: colors.foreground }]}>
                  {subscription.usage.projectsCount} / {subscription.usage.projectsLimit === -1 ? "∞" : subscription.usage.projectsLimit}
                </Text>
              </View>

              <View style={styles.usageRow}>
                <Text style={[styles.usageLabel, { color: colors.mutedForeground }]}>Deployments (month)</Text>
                <Text style={[styles.usageVal, { color: colors.foreground }]}>
                  {subscription.usage.deploymentsThisMonth} / {subscription.usage.deploymentsLimit === -1 ? "∞" : subscription.usage.deploymentsLimit}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.billingToggle}>
          {(["monthly", "yearly"] as const).map((b) => (
            <TouchableOpacity
              key={b}
              onPress={() => setBilling(b)}
              style={[
                styles.billingBtn,
                { backgroundColor: billing === b ? colors.primary : colors.card, borderColor: billing === b ? colors.primary : colors.border },
              ]}
            >
              <Text style={[styles.billingText, { color: billing === b ? "#FFF" : colors.mutedForeground }]}>
                {b === "monthly" ? "Monthly" : "Yearly (−20%)"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {plans &&
          Object.entries(plans as Record<string, any>).map(([key, plan]) => {
            const isCurrent = subscription?.plan === key;
            const gradient = PLAN_GRADIENT[key] ?? PLAN_GRADIENT.free!;
            return (
              <View key={key} style={[styles.planCard, { borderColor: key === "pro" ? colors.primary : colors.border, borderRadius: colors.radius }]}>
                {key === "pro" && (
                  <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}

                <LinearGradient colors={gradient} style={styles.planGradient}>
                  <View style={styles.planTop}>
                    <View style={[styles.planIconWrap, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                      <Feather name={PLAN_ICONS[key] as any} size={20} color="#FFF" />
                    </View>
                    <View>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planPrice}>
                        {plan.price === 0 ? "Free" : `$${getPrice(plan.price)}/mo`}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>

                <View style={[styles.planBody, { backgroundColor: colors.card }]}>
                  {plan.features.map((f: string) => (
                    <View key={f} style={styles.featureRow}>
                      <Feather name="check" size={14} color="#22C55E" style={{ marginRight: 10 }} />
                      <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={() => !isCurrent && handleUpgrade(key)}
                    disabled={isCurrent || key === "free" || upgrading === key}
                    style={[
                      styles.upgradeBtn,
                      {
                        backgroundColor: isCurrent ? colors.muted : key === "enterprise" ? "#0891B2" : colors.primary,
                        opacity: isCurrent || upgrading === key ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.upgradeBtnText, { color: isCurrent ? colors.mutedForeground : "#FFF" }]}>
                      {isCurrent ? "Current Plan" : upgrading === key ? "Processing…" : `Upgrade to ${plan.name}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

        <View style={[styles.trustRow, { borderTopColor: colors.border }]}>
          {["shield", "lock", "credit-card"].map((icon, i) => (
            <View key={i} style={styles.trustItem}>
              <Feather name={icon as any} size={16} color={colors.mutedForeground} />
              <Text style={[styles.trustText, { color: colors.mutedForeground }]}>
                {["Secure payment", "Encrypted data", "Cancel anytime"][i]}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 60 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  currentPlanCard: { margin: 20, padding: 20, borderWidth: 1 },
  currentPlanLabel: { fontSize: 12, fontWeight: "500", marginBottom: 4 },
  currentPlanName: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  usageBlock: { gap: 10 },
  usageRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  usageLabel: { fontSize: 13 },
  usageVal: { fontSize: 13, fontWeight: "600" },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  billingToggle: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  billingBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  billingText: { fontSize: 13, fontWeight: "600" },
  planCard: { marginHorizontal: 20, marginBottom: 16, borderWidth: 1, overflow: "hidden" },
  popularBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  popularText: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  planGradient: { padding: 20 },
  planTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  planIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  planName: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  planPrice: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 2 },
  planBody: { padding: 20 },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  featureText: { fontSize: 14 },
  upgradeBtn: { marginTop: 16, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  upgradeBtnText: { fontSize: 15, fontWeight: "700" },
  trustRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 20,
    paddingTop: 24,
    borderTopWidth: 1,
    marginTop: 8,
  },
  trustItem: { alignItems: "center", gap: 6 },
  trustText: { fontSize: 11 },
});
