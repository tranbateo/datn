import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import type { NotificationItem, QuizAttemptDetail } from '@/services/mobile.services';

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

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  n: 'ⁿ',
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
};

function toSuperscript(str: string): string {
  return str
    .split('')
    .map((ch) => SUPERSCRIPT_MAP[ch] ?? ch)
    .join('');
}

function toSubscript(str: string): string {
  return str
    .split('')
    .map((ch) => SUBSCRIPT_MAP[ch] ?? ch)
    .join('');
}

export function formatReadableMath(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // Strip LaTeX math delimiters cleanly: $$...$$, $...$, \[...\], \(...\)
  text = text
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\\\[([\s\S]*?)\\\]/g, '$1')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
    .replace(/\$([^$\n]+?)\$/g, '$1');

  // Common LaTeX commands -> crisp Unicode math
  text = text
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
    .replace(/\\text\{([^{}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^{}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^{}]+)\}/g, '$1')
    .replace(/\\left|\\right/g, '')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\neq|\\ne\b/g, '≠')
    .replace(/\\leq|\\le\b/g, '≤')
    .replace(/\\geq|\\ge\b/g, '≥')
    .replace(/\\approx/g, '≈')
    .replace(/\\infty/g, '∞')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\angle/g, '∠')
    .replace(/\\perp/g, '⊥')
    .replace(/\\parallel/g, '∥')
    .replace(/\\triangle/g, '△')
    .replace(/\\in\b/g, '∈')
    .replace(/\\notin\b/g, '∉')
    .replace(/\\subset\b/g, '⊂')
    .replace(/\\cup\b/g, '∪')
    .replace(/\\cap\b/g, '∩')
    .replace(/\\Leftrightarrow|\\iff/g, '⇔')
    .replace(/\\Rightarrow|\\implies/g, '⇒')
    .replace(/\\rightarrow|\\to\b/g, '→')
    .replace(/\\deg|\\circ/g, '°');

  // Exponents & subscripts: x^{2}, x^2, x_{1}, x_1
  text = text
    .replace(/\^\{([0-9+\-n]+)\}/g, (_, g: string) => toSuperscript(g))
    .replace(/\^([0-9])\b/g, (_, g: string) => toSuperscript(g))
    .replace(/_\{([0-9]+)\}/g, (_, g: string) => toSubscript(g))
    .replace(/_([0-9])\b/g, (_, g: string) => toSubscript(g));

  // Plain ASCII arrows & comparisons
  return text
    .replace(/<=>/g, '⇔')
    .replace(/=>/g, '⇒')
    .replace(/->/g, '→')
    .replace(/>=/g, '≥')
    .replace(/<=/g, '≤')
    .replace(/!=/g, '≠');
}

function renderInlineStyled(text: string, color: string, boldColor: string) {
  const formatted = formatReadableMath(text);
  const parts = formatted.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g);
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
            fontFamily: Platform.select({
              ios: 'Menlo',
              android: 'monospace',
              default: 'monospace',
            }),
            fontWeight: '700',
            color: boldColor,
          }}
        >
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <Text key={idx} style={{ fontStyle: 'italic', color }}>
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

function isMarkdownTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length >= 3;
}

function isMarkdownTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  return /^\|[\s:|-]+\|$/.test(trimmed) && trimmed.includes('-');
}

function parseTableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

/**
 * Lightweight native Markdown, Table & Math renderer for AI Tutor responses and lesson/PDF readers.
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

  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      elements.push(<View key={`sp-${i}`} style={{ height: 4 }} />);
      i++;
      continue;
    }

    // Markdown Table block: header + separator + rows
    if (
      isMarkdownTableRow(trimmed) &&
      i + 1 < lines.length &&
      isMarkdownTableSeparator(lines[i + 1])
    ) {
      const headers = parseTableCells(trimmed);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && isMarkdownTableRow(lines[j])) {
        rows.push(parseTableCells(lines[j]));
        j++;
      }

      elements.push(
        <ScrollView
          key={`tbl-${i}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginVertical: 4 }}
        >
          <View
            style={{
              borderWidth: 1,
              borderColor: p.border,
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: p.bg,
            }}
          >
            {/* Table Header */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: p.primarySoft,
                borderBottomWidth: 1,
                borderBottomColor: p.border,
              }}
            >
              {headers.map((h, hIdx) => (
                <View
                  key={`th-${hIdx}`}
                  style={{
                    minWidth: 112,
                    maxWidth: 200,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRightWidth: hIdx < headers.length - 1 ? 1 : 0,
                    borderRightColor: p.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: Math.max(12, fontSize - 1),
                      fontWeight: '800',
                      color: p.primary,
                      lineHeight: fontSize + 5,
                    }}
                  >
                    {renderInlineStyled(h, p.primary, p.primary)}
                  </Text>
                </View>
              ))}
            </View>
            {/* Table Rows */}
            {rows.map((row, rIdx) => (
              <View
                key={`tr-${rIdx}`}
                style={{
                  flexDirection: 'row',
                  backgroundColor: rIdx % 2 === 1 ? p.cardMuted : p.card,
                  borderBottomWidth: rIdx < rows.length - 1 ? 1 : 0,
                  borderBottomColor: p.border,
                }}
              >
                {headers.map((_, cIdx) => (
                  <View
                    key={`td-${rIdx}-${cIdx}`}
                    style={{
                      minWidth: 112,
                      maxWidth: 200,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRightWidth: cIdx < headers.length - 1 ? 1 : 0,
                      borderRightColor: p.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: Math.max(12, fontSize - 1),
                        color: textColor,
                        lineHeight: fontSize + 5,
                      }}
                    >
                      {renderInlineStyled(row[cIdx] || '', textColor, strongColor)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>,
      );

      i = j;
      continue;
    }

    // Horizontal Rule (--- or ***)
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      elements.push(
        <View
          key={`hr-${i}`}
          style={{
            height: 1,
            backgroundColor: p.border,
            marginVertical: 6,
          }}
        />,
      );
      i++;
      continue;
    }

    // Blockquote (> ...)
    const quoteMatch = trimmed.match(/^>\s*(.+)$/);
    if (quoteMatch) {
      elements.push(
        <View
          key={`bq-${i}`}
          style={{
            borderLeftWidth: 3,
            borderLeftColor: p.primary,
            backgroundColor: p.primarySoft,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            marginVertical: 2,
          }}
        >
          <Text style={{ fontSize, lineHeight: fontSize + 7, color: textColor }}>
            {renderInlineStyled(quoteMatch[1], textColor, strongColor)}
          </Text>
        </View>,
      );
      i++;
      continue;
    }

    // Headings (### / ## / #)
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      elements.push(
        <Text
          key={`h-${i}`}
          style={{
            color: strongColor,
            fontWeight: '800',
            fontSize:
              level === 1 ? fontSize + 3 : level === 2 ? fontSize + 2 : fontSize + 1,
            lineHeight: fontSize + 9,
            marginTop: i > 0 ? 4 : 0,
          }}
        >
          {renderInlineStyled(headingMatch[2], strongColor, strongColor)}
        </Text>,
      );
      i++;
      continue;
    }

    // Bullet items (- / * / + / •)
    const bulletMatch = trimmed.match(/^[-*+•]\s+(.+)$/);
    if (bulletMatch) {
      elements.push(
        <View
          key={`ul-${i}`}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7, paddingLeft: 4 }}
        >
          <Text
            style={{
              color: strongColor,
              fontWeight: '800',
              fontSize,
              lineHeight: fontSize + 7,
            }}
          >
            •
          </Text>
          <Text style={{ flex: 1, fontSize, lineHeight: fontSize + 7, color: textColor }}>
            {renderInlineStyled(bulletMatch[1], textColor, strongColor)}
          </Text>
        </View>,
      );
      i++;
      continue;
    }

    // Numbered list items (1. ...)
    const numMatch = trimmed.match(/^(\d+[.)])\s+(.+)$/);
    if (numMatch) {
      elements.push(
        <View
          key={`ol-${i}`}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingLeft: 2 }}
        >
          <Text
            style={{
              color: strongColor,
              fontWeight: '800',
              fontSize,
              lineHeight: fontSize + 7,
            }}
          >
            {numMatch[1]}
          </Text>
          <Text style={{ flex: 1, fontSize, lineHeight: fontSize + 7, color: textColor }}>
            {renderInlineStyled(numMatch[2], textColor, strongColor)}
          </Text>
        </View>,
      );
      i++;
      continue;
    }

    elements.push(
      <Text key={`p-${i}`} style={{ fontSize, lineHeight: fontSize + 7, color: textColor }}>
        {renderInlineStyled(trimmed, textColor, strongColor)}
      </Text>,
    );
    i++;
  }

  return <View style={{ gap: 5 }}>{elements}</View>;
}

export function SkeletonBox({
  height = 18,
  width = '100%',
  borderRadius = 12,
  style,
}: {
  height?: number;
  width?: number | `${number}%`;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const p = usePalette();
  const [pulse] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          height,
          width,
          borderRadius,
          backgroundColor: p.cardMuted,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

export function SkeletonDashboard({ label }: { label?: string }) {
  const p = usePalette();
  return (
    <SafeAreaView style={[styles.safeFill, { backgroundColor: p.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={[{ padding: 16, gap: 16 }, ADAPTIVE_CONTENT_STYLE]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <SkeletonBox width={44} height={44} borderRadius={22} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBox width="45%" height={12} borderRadius={6} />
            <SkeletonBox width="70%" height={20} borderRadius={8} />
          </View>
          <SkeletonBox width={44} height={44} borderRadius={22} />
        </View>
        <SkeletonBox height={138} borderRadius={22} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <SkeletonBox height={96} borderRadius={18} style={{ flex: 1 }} />
          <SkeletonBox height={96} borderRadius={18} style={{ flex: 1 }} />
        </View>
        <SkeletonBox width="42%" height={16} borderRadius={8} />
        <View style={{ gap: 10 }}>
          <SkeletonBox height={78} borderRadius={16} />
          <SkeletonBox height={78} borderRadius={16} />
          <SkeletonBox height={78} borderRadius={16} />
        </View>
        {label ? (
          <Text style={{ textAlign: 'center', fontSize: 12, color: p.textMuted }}>
            {label}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
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

/**
 * Shared read-only Attempt Detail Viewer Modal for Parents & Teachers
 * (backed by GET /quiz/attempts/:attemptId with RBAC ownership check).
 */
export function QuizAttemptViewerModal({
  visible,
  loading,
  detail,
  error,
  onClose,
}: {
  visible: boolean;
  loading: boolean;
  detail: QuizAttemptDetail | null;
  error?: string | null;
  onClose: () => void;
}) {
  const p = usePalette();
  const [onlyWrong, setOnlyWrong] = useState(false);

  const items = detail?.questionResults || [];
  const wrongCount = items.filter((q) => !q.isCorrect).length;
  const visibleItems = onlyWrong ? items.filter((q) => !q.isCorrect) : items;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeFill, { backgroundColor: p.bg }]}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            backgroundColor: p.card,
            borderBottomWidth: 1,
            borderBottomColor: p.border,
          }}
        >
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={p.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: p.text }} numberOfLines={1}>
              {detail?.quizTitle || 'Chi tiết bài làm'}
            </Text>
            {detail ? (
              <Text style={{ fontSize: 12, color: p.textMuted }}>
                {detail.subjectName} • Đúng {detail.score}/{detail.totalQuestions} câu ({detail.normalizedScore}/100)
              </Text>
            ) : null}
          </View>
          {detail ? (
            <Badge
              label={`${detail.normalizedScore}/100`}
              tone={detail.normalizedScore >= 50 ? 'emerald' : 'rose'}
            />
          ) : null}
        </View>

        {loading ? (
          <LoadingView label="Đang tải chi tiết bài làm..." />
        ) : error ? (
          <ErrorView message={error} onRetry={onClose} />
        ) : !detail ? (
          <View style={styles.centerWrap}>
            <EmptyView icon="document-text-outline" title="Không có dữ liệu bài làm" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={[{ padding: 16, gap: 12, paddingBottom: 36 }, ADAPTIVE_CONTENT_STYLE]}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setOnlyWrong(false)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: !onlyWrong ? p.primary : p.cardMuted,
                }}
              >
                <Text
                  style={{
                    color: !onlyWrong ? '#FFFFFF' : p.text,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  Tất cả ({items.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setOnlyWrong(true)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: onlyWrong ? p.rose : p.cardMuted,
                }}
              >
                <Text
                  style={{
                    color: onlyWrong ? '#FFFFFF' : p.text,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  Chỉ câu sai ({wrongCount})
                </Text>
              </TouchableOpacity>
            </View>

            {visibleItems.length === 0 ? (
              <EmptyView
                icon="checkmark-circle-outline"
                title="Không có câu làm sai!"
                description="Học sinh đã trả lời chính xác toàn bộ các câu hỏi trong đề này."
              />
            ) : (
              visibleItems.map((qr, idx) => (
                <Card key={`${qr.questionId}-${idx}`} style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Badge label={`Câu ${qr.questionNumber || idx + 1}`} tone="indigo" />
                    <Badge
                      label={qr.isCorrect ? 'Đúng' : 'Sai'}
                      tone={qr.isCorrect ? 'emerald' : 'rose'}
                    />
                  </View>
                  {qr.questionContent ? (
                    <RichText content={qr.questionContent} color={p.text} boldColor={p.text} fontSize={14} />
                  ) : null}
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: qr.isCorrect ? p.emerald : p.rose,
                    }}
                  >
                    Bài làm: {qr.selectedOption || '(Bỏ trống)'}
                  </Text>
                  {!qr.isCorrect ? (
                    <View style={{ backgroundColor: p.cardMuted, padding: 10, borderRadius: 10, gap: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: p.emerald }}>
                        Đáp án đúng: {qr.correctOption}
                      </Text>
                      {qr.errorAnalysis ? (
                        <Text style={{ fontSize: 12, color: p.rose, lineHeight: 18 }}>
                          Phân tích lỗi: {qr.errorAnalysis}
                        </Text>
                      ) : null}
                      {qr.correction || qr.explanation ? (
                        <RichText
                          content={`**Giải thích:** ${qr.correction || qr.explanation}`}
                          color={p.text}
                          boldColor={p.text}
                          fontSize={12}
                        />
                      ) : null}
                    </View>
                  ) : null}
                </Card>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeFill: {
    flex: 1,
  },
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
