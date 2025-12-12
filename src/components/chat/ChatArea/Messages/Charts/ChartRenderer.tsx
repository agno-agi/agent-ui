'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { ChartData } from '@/types/os'
import LineChartCard from './LineChartCard'
import BarChartCard from './BarChartCard'
import PieChartCard from './PieChartCard'
import AreaChartCard from './AreaChartCard'

interface ChartRendererProps {
  chart: ChartData
  className?: string
}

// Runtime shape guard to prevent Recharts crashes from malformed payloads
const isValidChartData = (chart: unknown): chart is ChartData => {
  if (!chart || typeof chart !== 'object') return false
  const c = chart as Record<string, unknown>
  if (!c.config || typeof c.config !== 'object') return false
  if (!c.data || !Array.isArray(c.data)) return false
  const config = c.config as Record<string, unknown>
  if (typeof config.type !== 'string') return false
  return true
}

const ChartRenderer = memo(({ chart, className }: ChartRendererProps) => {
  // Validate chart shape before accessing properties
  if (!isValidChartData(chart)) {
    return (
      <div
        className={cn(
          'w-full max-w-xl rounded-lg border border-border bg-background p-4',
          className
        )}
        role="figure"
        aria-label="Chart"
      >
        <div className="flex h-32 items-center justify-center text-sm text-muted">
          Invalid chart data
        </div>
      </div>
    )
  }

  const { config, data } = chart
  const { type, title, height = 300 } = config

  // Guard against empty data
  if (data.length === 0) {
    return (
      <div
        className={cn(
          'w-full max-w-xl rounded-lg border border-border bg-background p-4',
          className
        )}
        role="figure"
        aria-label={title || 'Chart'}
      >
        {title && (
          <div className="mb-3 text-sm font-medium text-primary">{title}</div>
        )}
        <div className="flex h-32 items-center justify-center text-sm text-muted">
          No data available
        </div>
      </div>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <LineChartCard data={data} config={config} height={height} />
      case 'bar':
        return <BarChartCard data={data} config={config} height={height} />
      case 'pie':
        return <PieChartCard data={data} config={config} height={height} />
      case 'area':
        return <AreaChartCard data={data} config={config} height={height} />
      case 'funnel':
        // Funnel uses bar chart as fallback for now
        return <BarChartCard data={data} config={config} height={height} />
      default:
        return (
          <div className="text-sm text-muted">
            Unsupported chart type: {type}
          </div>
        )
    }
  }

  return (
    <div
      className={cn(
        'w-full max-w-xl rounded-lg border border-border bg-background p-4',
        className
      )}
      role="figure"
      aria-label={title || `${type} chart`}
    >
      {title && (
        <div className="mb-3 text-sm font-medium text-primary">{title}</div>
      )}
      {renderChart()}
    </div>
  )
})

ChartRenderer.displayName = 'ChartRenderer'

export default ChartRenderer
