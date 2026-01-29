'use client'

interface ChartPlaceholderProps {
  title: string
  description: string
  type: 'line' | 'bar' | 'pie' | 'map'
}

export function ChartPlaceholder({ title, description }: ChartPlaceholderProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h4 className="text-base font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <div className="bg-gray-50 rounded h-64 flex items-center justify-center border border-gray-100">
        <p className="text-sm text-gray-400">Chart placeholder</p>
      </div>
    </div>
  )
}
