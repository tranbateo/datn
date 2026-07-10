import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect } from 'react';

import { API_ENDPOINTS } from '@/constants/api';

const API_URL = 'http://192.168.100.36:3001';

export default function ScheduleScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}${API_ENDPOINTS.CALENDAR.LIST}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();
  }, []);

  const pickImageAndScan = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      uploadAndScanImage(uri);
    }
  };

  const uploadAndScanImage = async (uri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'schedule.jpg';
      const type = 'image/jpeg';
      
      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      const res = await fetch(`${API_URL}${API_ENDPOINTS.CALENDAR.OCR}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!res.ok) throw new Error('Upload failed');
      
      const parsedEvents = await res.json();
      
      if (parsedEvents && parsedEvents.length > 0) {
        // Save them sequentially for simplicity
        for (const ev of parsedEvents) {
          await fetch(`${API_URL}${API_ENDPOINTS.CALENDAR.LIST}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ev)
          });
        }
        Alert.alert('Thành công', `Đã quét và lưu ${parsedEvents.length} lịch học!`);
        fetchEvents();
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy lịch học nào trong ảnh.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi quét lịch học.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Lịch Học</ThemedText>
      
      <TouchableOpacity style={styles.scanBtn} onPress={pickImageAndScan} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.btnText}>📷 Quét Lịch Học (OCR)</ThemedText>
        )}
      </TouchableOpacity>

      {events.length === 0 ? (
        <ThemedText style={styles.emptyText}>Chưa có lịch học nào.</ThemedText>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.eventCard}>
              <ThemedText type="subtitle">{item.title}</ThemedText>
              <ThemedText>{new Date(item.startTime).toLocaleString()} - {new Date(item.endTime).toLocaleTimeString()}</ThemedText>
              {item.description ? <ThemedText type="small">{item.description}</ThemedText> : null}
            </ThemedView>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { marginBottom: 16 },
  scanBtn: {
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 32 },
  list: { gap: 12, paddingBottom: 100 },
  eventCard: { padding: 16, borderRadius: 8, gap: 4 },
});
