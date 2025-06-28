'use client'

import React from 'react'

export interface ChartDataPoint {
  label?: string
  date?: string
  value: number
  color?: string
  successful?: number
  failed?: number
  [key: string]: any
}

interface BaseChartProps {
  data: ChartDataPoint[]
  title?: string
  className?: string
  height?: number
}

interface NameValueData {
  name: string
  value: number
  color?: string
}

interface NameValueChartProps {
  data: NameValueData[]
  title?: string
  className?: string
  height?: number
}

// Simple Bar Chart Component
export function BarChart({ data, title, className = '', height = 200 }: NameValueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        {title && <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>}
        <div className="flex items-center justify-center h-32 text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>}
      <div className="space-y-3" style={{ height }}>
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-20 text-sm text-gray-600 dark:text-gray-300 truncate">
              {item.name}
            </div>
            <div className="flex-1 mx-3">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                    backgroundColor: item.color || colors[index % colors.length]
                  }}
                />
              </div>
            </div>
            <div className="w-12 text-sm font-medium text-gray-900 dark:text-white text-right">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Enhanced Line Chart Component
export function LineChart({ data, title, className = '', height = 200 }: BaseChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        {title && <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>}
        <div className="flex items-center justify-center h-32 text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>}
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1="0"
              y1={height * ratio}
              x2="100%"
              y2={height * ratio}
              stroke="#E5E7EB"
              strokeWidth="1"
              opacity="0.5"
            />
          ))}

          {/* Line path */}
          {data.length > 1 && (
            <path
              d={data.map((point, index) => {
                const x = (index / (data.length - 1)) * 100
                const y = height - ((point.value - minValue) / range) * height
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`
              }).join(' ')}
              stroke="#3B82F6"
              strokeWidth="2"
              fill="none"
            />
          )}

          {/* Area fill */}
          {data.length > 1 && (
            <path
              d={data.map((point, index) => {
                const x = (index / (data.length - 1)) * 100
                const y = height - ((point.value - minValue) / range) * height
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`
              }).join(' ') + ` L 100% ${height} L 0% ${height} Z`}
              fill="url(#lineGradient)"
            />
          )}

          {/* Data points */}
          {data.map((point, index) => (
            <circle
              key={index}
              cx={data.length > 1 ? `${(index / (data.length - 1)) * 100}%` : '50%'}
              cy={height - ((point.value - minValue) / range) * height}
              r="4"
              fill="#3B82F6"
              className="hover:r-6 transition-all duration-200"
            />
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {data.map((point, index) => (
            <span key={index} className="truncate max-w-[60px]">
              {point.label || point.date || index}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// Enhanced Donut Chart Component
export function DonutChart({ data, title, className = '', height = 200 }: NameValueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        {title && <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>}
        <div className="flex items-center justify-center h-32 text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = Math.min(height / 2, 80)
  const strokeWidth = 20
  const normalizedRadius = radius - strokeWidth * 2
  const circumference = normalizedRadius * 2 * Math.PI

  let currentAngle = 0
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>}
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
            <circle
              cx={radius}
              cy={radius}
              r={normalizedRadius}
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {total > 0 && data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
              const strokeDashoffset = -((currentAngle / 360) * circumference)
              currentAngle += (item.value / total) * 360

              return (
                <circle
                  key={index}
                  cx={radius}
                  cy={radius}
                  r={normalizedRadius}
                  stroke={item.color || colors[index % colors.length]}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="ml-6 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: item.color || colors[index % colors.length] }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Enhanced Stats Card Component
export interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
  }
  subtitle?: string
  className?: string
}

export function StatCard({ title, value, icon, change, subtitle, className = '' }: StatCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          {change && (
            <p className={`text-sm flex items-center mt-1 ${
              change.type === 'increase'
                ? 'text-green-600 dark:text-green-400'
                : change.type === 'decrease'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              <span className="mr-1">
                {change.type === 'increase' ? '↗' : change.type === 'decrease' ? '↘' : '→'}
              </span>
              {change.type === 'neutral' ? change.value : `${Math.abs(change.value)}%`}
            </p>
          )}
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  )
}

// Multi-line Chart Component for complex data
export function MultiLineChart({ data, title, className = '', height = 200 }: BaseChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        {title && <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>}
        <div className="flex items-center justify-center h-32 text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.value, d.successful || 0, d.failed || 0)))
  const minValue = Math.min(...data.map(d => Math.min(d.value, d.successful || 0, d.failed || 0)))
  const range = maxValue - minValue || 1

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>}
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            <linearGradient id="successGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="failedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1="0"
              y1={height * ratio}
              x2="100%"
              y2={height * ratio}
              stroke="#E5E7EB"
              strokeWidth="1"
              opacity="0.5"
            />
          ))}

          {/* Successful line */}
          {data.some(d => d.successful !== undefined) && data.length > 1 && (
            <path
              d={data.map((point, index) => {
                const x = (index / (data.length - 1)) * 100
                const y = height - ((point.successful || 0) - minValue) / range * height
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`
              }).join(' ')}
              stroke="#10B981"
              strokeWidth="2"
              fill="none"
            />
          )}

          {/* Failed line */}
          {data.some(d => d.failed !== undefined) && data.length > 1 && (
            <path
              d={data.map((point, index) => {
                const x = (index / (data.length - 1)) * 100
                const y = height - ((point.failed || 0) - minValue) / range * height
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`
              }).join(' ')}
              stroke="#EF4444"
              strokeWidth="2"
              fill="none"
            />
          )}

          {/* Main line */}
          {data.length > 1 && (
            <path
              d={data.map((point, index) => {
                const x = (index / (data.length - 1)) * 100
                const y = height - ((point.value - minValue) / range) * height
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`
              }).join(' ')}
              stroke="#3B82F6"
              strokeWidth="2"
              fill="none"
            />
          )}

          {/* Data points */}
          {data.map((point, index) => (
            <g key={index}>
              <circle
                cx={data.length > 1 ? `${(index / (data.length - 1)) * 100}%` : '50%'}
                cy={height - ((point.value - minValue) / range) * height}
                r="4"
                fill="#3B82F6"
                className="hover:r-6 transition-all duration-200"
              />
              {point.successful !== undefined && (
                <circle
                  cx={data.length > 1 ? `${(index / (data.length - 1)) * 100}%` : '50%'}
                  cy={height - ((point.successful - minValue) / range) * height}
                  r="3"
                  fill="#10B981"
                />
              )}
              {point.failed !== undefined && (
                <circle
                  cx={data.length > 1 ? `${(index / (data.length - 1)) * 100}%` : '50%'}
                  cy={height - ((point.failed - minValue) / range) * height}
                  r="3"
                  fill="#EF4444"
                />
              )}
            </g>
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {data.map((point, index) => (
            <span key={index} className="truncate max-w-[60px]">
              {point.label || point.date || index}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">Total</span>
        </div>
        {data.some(d => d.successful !== undefined) && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">Successful</span>
          </div>
        )}
        {data.some(d => d.failed !== undefined) && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">Failed</span>
          </div>
        )}
      </div>
    </div>
  )
}
