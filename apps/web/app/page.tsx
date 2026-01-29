import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ChartPlaceholder } from '@/components/dashboard/ChartPlaceholder'

export default function Home() {
  const stats = [
    {
      title: 'Total Users',
      value: '2,847',
      change: '+4.2%',
      trend: 'up' as const,
    },
    {
      title: 'Active Sessions',
      value: '1,392',
      change: '+12.7%',
      trend: 'up' as const,
    },
    {
      title: 'Avg Response Time',
      value: '142ms',
      change: '-8.1%',
      trend: 'up' as const,
    },
    {
      title: 'Error Rate',
      value: '0.24%',
      change: '-0.08%',
      trend: 'up' as const,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Data Dashboard
            </h1>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button>
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Monitor your data.<br />Make better decisions.
          </h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            A clean, fast dashboard for tracking metrics that matter. 
            No bloat, no BS.
          </p>
          <div className="flex gap-3">
            <Link href="/register">
              <Button size="lg">
                Get started
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                View demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      {/* Charts Section */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartPlaceholder
            title="Traffic Overview"
            description="Last 7 days"
            type="line"
          />
          <ChartPlaceholder
            title="Top Sources"
            description="By visitor count"
            type="bar"
          />
          <ChartPlaceholder
            title="Geographic Distribution"
            description="Visitor locations"
            type="map"
          />
          <ChartPlaceholder
            title="Device Breakdown"
            description="Desktop vs Mobile"
            type="pie"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p className="text-sm text-gray-500">© 2026 Data Dashboard</p>
        </div>
      </footer>
    </div>
  )
}
