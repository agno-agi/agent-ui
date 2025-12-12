'use client'

import { memo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import type { ChartConfig } from '@/types/os'

// Theme colors matching Tailwind config
const THEME = {
  tooltipBg: '#111113',
  tooltipBorder: '#27272A',
  tooltipLabel: '#FAFAFA',
  legendText: '#A1A1AA'
}

const COLORS = [
  '#22c55e',
  '#3b82f6',
  '#eab308',
  '#f97316',
  '#ec4899',
  '#a855f7',
  '#06b6d4',
  '#84cc16'
]

interface PieChartCardProps {
  data: Array<Record<string, string | number | null>>
  config: ChartConfig
  height: number
}

const PieChartCard = memo(({ data, config, height }: PieChartCardProps) => {
  const { xKey = 'name', series = [] } = config

  // For pie charts, use the first series key as the value key
  const valueKey =
    series[0]?.key ||
    (data.length > 0
      ? Object.keys(data[0]).find(
          (key) => key !== xKey && typeof data[0]?.[key] === 'number'
        )
      : undefined) ||
    'value'

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={xKey}
          cx="50%"
          cy="50%"
          outerRadius={Math.min(height * 0.35, 120)}
          label={({ name, percent }) => {
            const displayName = name != null ? String(name) : ''
            const displayPercent =
              typeof percent === 'number' ? (percent * 100).toFixed(0) : '0'
            return `${displayName} ${displayPercent}%`
          }}
          labelLine={false}
          isAnimationActive={!prefersReducedMotion}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: THEME.tooltipBg,
            border: `1px solid ${THEME.tooltipBorder}`,
            borderRadius: '8px',
            fontSize: '12px'
          }}
          labelStyle={{ color: THEME.tooltipLabel }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          formatter={(value) => (
            <span style={{ color: THEME.legendText }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
})

PieChartCard.displayName = 'PieChartCard'

export default PieChartCard
