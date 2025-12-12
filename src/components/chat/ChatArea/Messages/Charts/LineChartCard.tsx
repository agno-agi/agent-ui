'use client'

import { memo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import type { ChartConfig, ChartSeries } from '@/types/os'

// Theme colors matching Tailwind config
const THEME = {
  grid: '#27272A',
  axis: '#A1A1AA',
  tooltipBg: '#111113',
  tooltipBorder: '#27272A',
  tooltipLabel: '#FAFAFA'
}

const COLORS = [
  '#22c55e',
  '#3b82f6',
  '#eab308',
  '#f97316',
  '#ec4899',
  '#a855f7'
]

interface LineChartCardProps {
  data: Array<Record<string, string | number | null>>
  config: ChartConfig
  height: number
}

const LineChartCard = memo(({ data, config, height }: LineChartCardProps) => {
  const { xKey = 'x', series = [] } = config

  // If no series defined, try to infer from data keys
  const effectiveSeries: ChartSeries[] =
    series.length > 0
      ? series
      : data.length > 0
        ? Object.keys(data[0])
            .filter((key) => key !== xKey)
            .map((key) => ({ key, label: key }))
        : []

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
        <XAxis
          dataKey={xKey}
          stroke={THEME.axis}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={THEME.axis}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: THEME.tooltipBg,
            border: `1px solid ${THEME.tooltipBorder}`,
            borderRadius: '8px',
            fontSize: '12px'
          }}
          labelStyle={{ color: THEME.tooltipLabel }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {effectiveSeries.map((s, idx) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label || s.key}
            stroke={s.color || COLORS[idx % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={
              !window.matchMedia('(prefers-reduced-motion: reduce)').matches
            }
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
})

LineChartCard.displayName = 'LineChartCard'

export default LineChartCard
