import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NotificationItem } from '@/services/mobile.services';

export const ADAPTIVE_CONTENT_STYLE: ViewStyle = {
  width: '100%',
  maxWidth: 720,
  alignSelf: 'center',
};

export function usePalette() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return useMemo(
    () => ({
      isDark,
      bg: isDark ? '#0B1120' : '#F8FAFC',
      card: isDark ? '#111827' : '#FFFFFF',
      cardMuted: isDark ? '#1E293B' : '#F1F5F9',
      border: isDark ? '#1F2937' : '#E2E8F0',
      text: isDark ? '#F8FAFC' : '#0F172A',
      textMuted: isDark ? '#94A3B8' : '#64748B',
      primary: '#2563EB',
      primarySoft: isDark ? 'rgba(37, 99, 235, 0.22)' : '#EFF6FF',
      indigo: '#4F46E5',
      indigoSoft: isDark ? 'rgba(79, 70, 229, 0.22)' : '#EEF2FF',
      emerald: '#059669',
      emeraldSoft: isDark ? 'rgba(5, 150, 105, 0.22)' : '#ECFDF5',
      amber: '#D97706',
      amberSoft: isDark ? 'rgba(217, 119, 6, 0.22)' : '#FFFBEB',
      rose: '#E11D48',
      roseSoft: isDark ? 'rgba(225, 29, 72, 0.22)' : '#FFF1F2',
    }),
    [isDark],
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const p = usePalette();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: p.card,
          borderColor: p.border,
          shadowColor: p.isDark ? '#000000' : '#0F172A',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function UserAvatar({
  uri,
  name,
  size = 46,
  bgColor,
  textColor = '#FFFFFF',
}: {
  uri?: string | null;
  name?: string | null;
  size?: number;
  bgColor?: string;
  textColor?: string;
}) {
  const p = usePalette();
  const initial = (name || 'U').trim().charAt(0).toUpperCase();
  const radius = size / 2;

  if (uri && (uri.startsWith('http') || uri.startsWith('data:image/'))) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: p.cardMuted,
        }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: bgColor || p.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: textColor,
          fontWeight: '800',
          fontSize: Math.max(14, Math.round(size * 0.4)),
        }}
      >
        {initial}
      </Text>
    </View>
  );
}

export function formatReadableMath(raw: string): string {
  return raw
    .replace(/<=>/g, '⇔')
    .replace(/=>/g, '⇒')
    .replace(/->/g, '→')
    .replace(/>=/g, '≥')
    .replace(/<=/g, '≤')
    .replace(/\^2\b/g, '²')
    .replace(/\^3\b/g, '³');
}

function renderInlineBold(text: string, color: string, boldColor: string) {
  const formatted = formatReadableMath(text);
  const parts = formatted.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <Text key={idx} style={{ fontWeight: '800', color: boldColor }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <Text
          key={idx}
          style={{
            fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
            fontWeight: '700',
            color: boldColor,
          }}
        >
          {part.slice(1, -1)}
        </Text>
      );
    }
    return (
      <Text key={idx} style={{ color }}>
        {part}
      </Text>
    );
  });
}

/**
 * Lightweight native Markdown & Math renderer for AI Tutor responses and lesson/PDF readers.
 */
export function RichText({
  content,
  color,
  boldColor,
  fontSize = 14,
}: {
  content: string;
  color?: string;
  boldColor?: string;
  fontSize?: number;
}) {
  const p = usePalette();
  const textColor = color || p.text;
  const strongColor = boldColor || textColor;
  const lines = (content || '').replace(/\r\n/g, '\n').split('\n');

  return (
    <View style={{ gap: 5 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={idx} style={{ height: 4 }} />;

        // Headings (### / ## / #)
        const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          return (
            <Text
              key={idx}
              style={{
                color: strongColor,
                fontWeight: '800',
                fontSize: level === 1 ? fontSize + 3 : level === 2 ? fontSize + 2 : fontSize + 1,
                lineHeight: fontSize + 9,
                marginTop: idx > 0 ? 4 : 0,
              }}
            >
              {renderInlineBold(headingMatch[2], strongColor, strongColor)}
            </Text>
          );
        }

        // Bullet items (- / * / •)
        const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
        if (bulletMatch) {
          return (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7, paddingLeft: 4 }}>
              <Text style={{ color: strongColor, fontWeight: '800', fontSize, lineHeight: fontSize + 7 }}>
                •
              </Text>
              <Text style={{ flex: 1, fontSize, lineHeight: fontSize + 7, color: textColor }}>
                {renderInlineBold(bulletMatch[1], textColor, strongColor)}
              </Text>
            </View>
          );
        }

        // Numbered list items (1. ...)
        const numMatch = trimmed.match(/^(\d+[.)])\s+(.+)$/);
        if (numMatch) {
          return (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingLeft: 2 }}>
              <Text style={{ color: strongColor, fontWeight: '800', fontSize, lineHeight: fontSize + 7 }}>
                {numMatch[1]}
              </Text>
              <Text style={{ flex: 1, fontSize, lineHeight: fontSize + 7, color: textColor }}>
                {renderInlineBold(numMatch[2], textColor, strongColor)}
              </Text>
            </View>
          );
        }

        return (
          <Text key={idx} style={{ fontSize, lineHeight: fontSize + 7, color: textColor }}>
            {renderInlineBold(trimmed, textColor, strongColor)}
          </Text>
        );
      })}
    </View>
  );
}

export function Badge({
  label,
  tone = 'blue',
}: {
  label: string;
  tone?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
}) {
  const p = usePalette();
  const colors = {
    blue: { bg: p.primarySoft, fg: p.primary },
    indigo: { bg: p.indigoSoft, fg: p.indigo },
    emerald: { bg: p.emeraldSoft, fg: p.emerald },
    amber: { bg: p.amberSoft, fg: p.amber },
    rose: { bg: p.roseSoft, fg: p.rose },
    slate: { bg: p.cardMuted, fg: p.textMuted },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  color,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}) {
  const p = usePalette();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.primaryBtn,
        { backgroundColor: color || p.primary },
        (disabled || loading) && styles.disabledBtn,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color="#FFFFFF" /> : null}
          <Text style={styles.primaryBtnText}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function LoadingView({ label = 'Đang tải dữ liệu...' }: { label?: string }) {
  const p = usePalette();
  return (
    <SafeAreaView style={[styles.centerWrap, { backgroundColor: p.bg }]}>
      <ActivityIndicator size="large" color={p.primary} />
      <Text style={[styles.centerLabel, { color: p.textMuted }]}>{label}</Text>
    </SafeAreaView>
  );
}

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const p = usePalette();
  return (
    <SafeAreaView style={[styles.centerWrap, { backgroundColor: p.bg }]}>
      <View style={[styles.errorIconWrap, { backgroundColor: p.roseSoft }]}>
        <Ionicons name="alert-circle-outline" size={32} color={p.rose} />
      </View>
      <Text style={[styles.errorTitle, { color: p.text }]}>Không thể tải dữ liệu</Text>
      <Text style={[styles.centerLabel, { color: p.textMuted }]}>{message}</Text>
      <PrimaryButton
        title="Thử lại"
        icon="refresh"
        onPress={onRetry}
        style={{ marginTop: 16, paddingHorizontal: 28 }}
      />
    </SafeAreaView>
  );
}

export function EmptyView({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const p = usePalette();
  return (
    <Card style={styles.emptyCard}>
      <View style={[styles.emptyIcon, { backgroundColor: p.cardMuted }]}>
        <Ionicons name={icon} size={28} color={p.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: p.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.emptyDesc, { color: p.textMuted }]}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <PrimaryButton
          title={actionLabel}
          onPress={onAction}
          style={{ marginTop: 14, paddingHorizontal: 22 }}
        />
      ) : null}
    </Card>
  );
}

export function NotificationSheet({
  visible,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onPressItem,
}: {
  visible: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onPressItem?: (item: NotificationItem) => void;
}) {
  const p = usePalette();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheetContainer,
            { backgroundColor: p.card, borderColor: p.border },
          ]}
          onPress={() => undefined}
        >
          <View style={[styles.sheetHeader, { borderBottomColor: p.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.sheetTitle, { color: p.text }]}>Thông báo</Text>
              {unreadCount > 0 ? <Badge label={`${unreadCount} mới`} tone="rose" /> : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {unreadCount > 0 ? (
                <TouchableOpacity onPress={onMarkAllRead}>
                  <Text style={{ color: p.primary, fontWeight: '700', fontSize: 13 }}>
                    Đọc tất cả
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={24} color={p.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
            {notifications.length === 0 ? (
              <EmptyView
                icon="notifications-off-outline"
                title="Chưa có thông báo mới"
                description="Các thông báo từ nhà trường, giáo viên và bài tập sẽ hiển thị tại đây."
              />
            ) : (
              notifications.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (!n.isRead) onMarkRead(n.id);
                    onPressItem?.(n);
                  }}
                  style={[
                    styles.notifItem,
                    {
                      backgroundColor: n.isRead ? p.card : p.primarySoft,
                      borderColor: p.border,
                    },
                  ]}
                >
                  <View style={styles.notifTopRow}>
                    <Text style={[styles.notifTitle, { color: p.text, flex: 1 }]}>
                      {n.title}
                    </Text>
                    {!n.isRead ? (
                      <View style={[styles.unreadDot, { backgroundColor: p.primary }]} />
                    ) : null}
                  </View>
                  <Text style={[styles.notifBody, { color: p.textMuted }]}>{n.body}</Text>
                  <Text style={[styles.notifTime, { color: p.primary }]}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  primaryBtn: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centerLabel: {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '82%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  notifItem: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  notifBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
});
