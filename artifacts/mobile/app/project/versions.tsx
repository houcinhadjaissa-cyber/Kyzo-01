import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

type Version = {
  id: string;
  projectId: string;
  versionNumber: string;
  changelog: string | null;
  createdAt: string;
};

export default function VersionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const isWeb = Platform.OS === "web";
  const BASE = process.env.EXPO_PUBLIC_DOMAIN ? 'https://' + process.env.EXPO_PUBLIC_DOMAIN : '';

  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [bumpType, setBumpType] = useState('patch');
  const [changelog, setChangelog] = useState("");

  const fetchVersions = () => {
    setLoading(true);
    fetch(BASE + `/api/projects/${id}/versions`)
      .then(r => r.json())
      .then(data => { setVersions(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchVersions();
  }, [id]);

  const handleRollback = (versionId: string) => {
    if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Confirm Rollback", "Are you sure you want to rollback to this version?", [
      { text: "Cancel", style: "cancel" },
      { text: "Rollback", style: "destructive", onPress: () => {
        fetch(BASE + `/api/projects/${id}/versions/${versionId}/rollback`, { method: 'POST' })
          .then(r => {
            if (r.ok) {
              if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success", "Rolled back successfully");
              fetchVersions();
            }
          });
      }}
    ]);
  };

  const handleCreate = () => {
    if (!changelog.trim()) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fetch(BASE + `/api/projects/${id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bumpType, changelog })
    }).then(r => {
      if (r.ok) {
        setShowCreate(false);
        setChangelog("");
        fetchVersions();
      }
    });
  };

  const renderItem = ({ item, index }: { item: Version, index: number }) => {
    const isLatest = index === 0;
    return (
      <View style={[styles.versionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.versionHeader}>
          <View style={[styles.versionBadge, { backgroundColor: isLatest ? "#22C55E20" : colors.primary + '20' }]}>
            <Text style={[styles.versionNumber, { color: isLatest ? "#22C55E" : colors.primary }]}>{item.versionNumber}</Text>
          </View>
          {isLatest && <Text style={[styles.currentLabel, { color: "#22C55E" }]}>Current</Text>}
          <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <Text style={[styles.changelog, { color: colors.foreground }]}>{item.changelog || "No changelog provided."}</Text>
        {!isLatest && (
          <TouchableOpacity style={[styles.rollbackBtn, { borderColor: colors.border }]} onPress={() => handleRollback(item.id)}>
            <Feather name="rotate-ccw" size={14} color={colors.foreground} />
            <Text style={[styles.rollbackText, { color: colors.foreground }]}>Rollback to this version</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.center}><Text style={{ color: colors.mutedForeground }}>Loading...</Text></View>
      ) : versions.length === 0 ? (
        <View style={styles.center}>
          <Feather name="git-commit" size={48} color={colors.muted} style={{ marginBottom: 16 }} />
          <Text style={{ color: colors.mutedForeground }}>No versions yet.</Text>
        </View>
      ) : (
        <FlatList
          data={versions}
          keyExtractor={v => v.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {showCreate ? (
        <View style={[styles.createArea, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.bumpChips}>
            {['patch', 'minor', 'major'].map(t => (
              <TouchableOpacity key={t} style={[styles.bumpChip, bumpType === t ? { backgroundColor: colors.primary } : { backgroundColor: colors.muted }]} onPress={() => setBumpType(t)}>
                <Text style={[styles.bumpText, { color: bumpType === t ? "#FFF" : colors.foreground }]}>{t.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Changelog description..."
            placeholderTextColor={colors.mutedForeground}
            value={changelog}
            onChangeText={setChangelog}
          />
          <View style={styles.createActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
              <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleCreate}>
              <Text style={{ color: "#FFF", fontWeight: '600' }}>Create Version</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setShowCreate(true)}>
          <Feather name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100, gap: 16 },
  versionCard: { padding: 16, borderRadius: 12, borderWidth: 1 },
  versionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  versionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  versionNumber: { fontSize: 14, fontWeight: 'bold' },
  currentLabel: { fontSize: 12, fontWeight: '600', marginRight: 8 },
  dateLabel: { fontSize: 12, marginLeft: 'auto' },
  changelog: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  rollbackBtn: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderRadius: 8, alignSelf: 'flex-start', gap: 6 },
  rollbackText: { fontSize: 12, fontWeight: '500' },
  fab: { position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  createArea: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32, borderTopWidth: 1, elevation: 10 },
  bumpChips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  bumpChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  bumpText: { fontSize: 12, fontWeight: 'bold' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  createActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, alignItems: 'center' },
  cancelBtn: { padding: 8 },
  submitBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }
});
