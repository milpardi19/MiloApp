import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '@/lib/theme';

export function PatternGrid({ value, onChange, disabled = false }: {
  value: number[];
  onChange: (next: number[]) => void;
  disabled?: boolean;
}) {
  const toggle = (point: number) => {
    if (disabled || value.includes(point)) return;
    onChange([...value, point]);
  };

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="الگوی نه‌نقطه‌ای" style={styles.grid}>
      {Array.from({ length: 9 }, (_, index) => index + 1).map(point => {
        const order = value.indexOf(point);
        const selected = order >= 0;
        return (
          <Pressable
            key={point}
            accessibilityRole="button"
            accessibilityLabel={`نقطه ${point}${selected ? `، انتخاب ${order + 1}` : ''}`}
            accessibilityState={{ selected, disabled: disabled || selected }}
            disabled={disabled || selected}
            onPress={() => toggle(point)}
            style={({ pressed }) => [styles.cell, selected && styles.cellSelected, pressed && styles.cellPressed]}
          >
            <View style={[styles.dot, selected && styles.dotSelected]}>
              {selected ? <Text style={styles.order}>{order + 1}</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { width: 246, flexDirection: 'row-reverse', flexWrap: 'wrap', alignSelf: 'center' },
  cell: { width: 82, height: 82, alignItems: 'center', justifyContent: 'center' },
  cellSelected: { opacity: 1 },
  cellPressed: { opacity: .72 },
  dot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: Colors.neutral[500], backgroundColor: Colors.neutral[900], alignItems: 'center', justifyContent: 'center' },
  dotSelected: { width: 42, height: 42, borderRadius: 21, borderColor: Colors.primary[300], backgroundColor: Colors.primary[500] },
  order: { fontFamily: Typography.fontFamily, color: Colors.onColor, fontSize: 14, fontWeight: '700' },
});
