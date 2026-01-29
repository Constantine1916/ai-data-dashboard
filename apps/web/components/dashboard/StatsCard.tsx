'use client'

interface StatsCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
}

export function StatsCard({ title, value, change, trend }: StatsCardProps) {
  const isPositive = trend === 'up'
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <span className={`text-xs font-medium ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
          {change}
        </span>
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}
