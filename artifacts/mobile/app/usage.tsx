import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

export default function UsageScreen() {
  const colors = useColors();
  const BASE = process.env.EXPO_PUBLIC_DOMAIN ? 'https://' + process.env.EXPO_PUBLIC_DOMAIN : '';
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    fetch(BASE + '/api/usage')
      .then(r => r.json())
      .then(data => setUsage(data))
      .catch(() => {});
  }, []);

  if (!usage) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.mutedForeground }}>Loading usage data...</Text>
      </View>
    );
  }

  const StatCard = ({ title, value, sub }: { title: string, value: string, sub?: string }) => (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      {sub && <Text style={[styles.statSub, { color: colors.mutedForeground }]}>{sub}</Text>}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.grid}>
        <StatCard title="Today Tokens" value={usage.todayTokens?.toLocaleString() || "0"} />
        <StatCard title="Today Cost" value={`$${(usage.todayCost || 0).toFixed(4)}`} />
        <StatCard title="Month Tokens" value={usage.monthTokens?.toLocaleString() || "0"} />
        <StatCard title="Month Cost" value={`$${(usage.monthCost || 0).toFixed(4)}`} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>By Model</Text>
      <View style={[styles.listContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
        {(usage.byModel || []).map((m: any, i: number) => (
          <View key={m.model} style={[styles.listItem, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.listRow}>
              <Text style={[styles.listName, { color: colors.foreground }]}>{m.model}</Text>
              <Text style={[styles.listValue, { color: colors.foreground }]}>{m.tokens.toLocaleString()} tkns</Text>
            </View>
            <View style={styles.listRow}>
              <View style={[styles.barBg, { backgroundColor: colors.muted }]}>
                <View style={[styles.barFill, { backgroundColor: colors.primary, width: `${Math.min(100, (m.tokens / (usage.monthTokens || 1)) * 100)}%` }]} />
              </View>
              <Text style={[styles.listSub, { color: colors.mutedForeground }]}>${(m.cost || 0).toFixed(4)}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>By Project</Text>
      <View style={[styles.listContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
        {(usage.byProject || []).map((p: any, i: number) => (
          <View key={p.projectId} style={[styles.listItem, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.listRow}>
              <Text style={[styles.listName, { color: colors.foreground }]}>{p.projectId.substring(0,8)}...</Text>
              <Text style={[styles.listValue, { color: colors.foreground }]}>{p.tokens.toLocaleString()} tkns</Text>
            </View>
            <Text style={[styles.listSub, { color: colors.mutedForeground, marginTop: 4 }]}>${(p.cost || 0).toFixed(4)}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.footer, { color: colors.mutedForeground }]}>Powered by OpenRouter</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  statCard: { width: '48%', padding: 16, borderRadius: 12, borderWidth: 1 },
  statTitle: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statSub: { fontSize: 11 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  listContainer: { borderRadius: 12, borderWidth: 1, marginBottom: 32, overflow: 'hidden' },
  listItem: { padding: 16 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  listName: { fontSize: 14, fontWeight: '500' },
  listValue: { fontSize: 14, fontWeight: 'bold' },
  listSub: { fontSize: 12 },
  barBg: { flex: 1, height: 6, borderRadius: 3, marginRight: 16, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 16 }
});
