import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Text } from '@/components';
import { caseCopy } from '@/copy';
import { size, space, typography, useTheme } from '@/theme';

export type ChartPoint = { value: number | null; marker?: string | null };

type Props = {
  points: readonly ChartPoint[];
  /** Horizontal reference line (e.g. the baseline). */
  baseline?: number | null;
  baselineLabel?: string;
  /** Index range to shade (e.g. the calm start). */
  shade?: { from: number; to: number } | null;
  /** Draw dots for each value (per-test chart) or a smooth line only (trend). */
  dots?: boolean;
  height?: number;
  accessibilityLabel: string;
  testID?: string;
};

const MAX = 4;
const PAD = { top: space.sm, bottom: space.lg, left: space.xxl + space.md, right: space.xs };

/**
 * Score chart (0 Great at the bottom, 4 Awful at the top). SVG only, no chart dependency. Screen
 * readers get the summary label instead of the drawing.
 */
export function ScoreChart({
  points,
  baseline,
  baselineLabel,
  shade,
  dots = false,
  height = size.ring * 1.4,
  accessibilityLabel,
  testID,
}: Props) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / MAX) * innerH;

  let d = '';
  let pen = false;
  points.forEach((p, i) => {
    if (p.value === null) {
      pen = false;
      return;
    }
    d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)} `;
    pen = true;
  });

  return (
    <View onLayout={onLayout} accessible accessibilityLabel={accessibilityLabel} testID={testID}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {shade ? (
            <Rect
              x={x(shade.from)}
              y={PAD.top}
              width={Math.max(0, x(shade.to) - x(shade.from))}
              height={innerH}
              fill={colors.goodSoft}
            />
          ) : null}
          {[0, 2, 4].map((v) => (
            <Line
              key={v}
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke={colors.border}
              strokeWidth={1}
            />
          ))}
          <SvgText
            x={0}
            y={y(4) + 4}
            fill={colors.textSecondary}
            fontSize={typography.caption.fontSize}
            fontFamily={typography.caption.fontFamily}
          >
            {caseCopy.scoreAxisTop}
          </SvgText>
          <SvgText
            x={0}
            y={y(0)}
            fill={colors.textSecondary}
            fontSize={typography.caption.fontSize}
            fontFamily={typography.caption.fontFamily}
          >
            {caseCopy.scoreAxisBottom}
          </SvgText>
          {baseline !== null && baseline !== undefined ? (
            <Line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(baseline)}
              y2={y(baseline)}
              stroke={colors.good}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          ) : null}
          <Path
            d={d}
            stroke={colors.brand}
            strokeWidth={3}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((p, i) =>
            p.marker ? (
              <Line
                key={`m${i}`}
                x1={x(i)}
                x2={x(i)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                stroke={colors.partial}
                strokeWidth={2}
              />
            ) : null,
          )}
          {dots
            ? points.map((p, i) =>
                p.value === null ? null : (
                  <Circle
                    key={`d${i}`}
                    cx={x(i)}
                    cy={y(p.value)}
                    r={5}
                    fill={p.marker ? colors.partial : colors.brand}
                  />
                ),
              )
            : null}
          {points.map((p, i) =>
            p.marker ? (
              <SvgText
                key={`t${i}`}
                x={x(i)}
                y={height - 2}
                fill={colors.partialInk}
                fontSize={typography.caption.fontSize}
                fontFamily={typography.caption.fontFamily}
                textAnchor="middle"
              >
                {p.marker}
              </SvgText>
            ) : null,
          )}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      {baselineLabel && baseline !== null && baseline !== undefined ? (
        <View style={styles.legend}>
          <View style={[styles.swatch, { backgroundColor: colors.good }]} />
          <Text variant="caption" color="textSecondary">
            {baselineLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xxs },
  swatch: { width: space.md, height: 3 },
});
