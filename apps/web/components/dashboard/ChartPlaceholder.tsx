'use client'

interface ChartPlaceholderProps {
  title: string
  description: string
  type: 'line' | 'bar' | 'pie' | 'map'
}

export function ChartPlaceholder({ title, description, type }: ChartPlaceholderProps) {
  const icons = {
    line: '📈',
    bar: '📊',
    pie: '🥧',
    map: '🗺️',
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
      <div className="mb-4">
        <h4 className="text-xl font-bold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl h-64 flex flex-col items-center justify-center border border-indigo-100">
        <div className="text-6xl mb-4">{icons[type]}</div>
        <p className="text-gray-500 text-sm">图表占位符</p>
        <p className="text-gray-400 text-xs mt-2">后续集成 Chart.js / Recharts / D3.js</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-indigo-600">1,234</p>
          <p className="text-xs text-gray-600">数据点</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">+12%</p>
          <p className="text-xs text-gray-600">增长率</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-pink-600">98.5%</p>
          <p className="text-xs text-gray-600">准确率</p>
        </div>
      </div>
    </div>
  )
}
