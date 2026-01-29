'use client'

interface StatsCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: string
}

export function StatsCard({ title, value, change, trend, icon }: StatsCardProps) {
  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600'
  const trendBg = trend === 'up' ? 'bg-green-50' : 'bg-red-50'

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl">{icon}</div>
        <span className={`${trendBg} ${trendColor} text-sm font-semibold px-3 py-1 rounded-full`}>
          {change}
        </span>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
