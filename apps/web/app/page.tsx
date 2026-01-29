import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ChartPlaceholder } from '@/components/dashboard/ChartPlaceholder'

export default function Home() {
  // 模拟数据，后续可以从 API 获取
  const stats = [
    {
      title: '总用户数',
      value: '12,345',
      change: '+12.5%',
      trend: 'up' as const,
      icon: '👥',
    },
    {
      title: '活跃用户',
      value: '8,234',
      change: '+8.2%',
      trend: 'up' as const,
      icon: '⚡',
    },
    {
      title: '总收入',
      value: '$45,678',
      change: '+23.1%',
      trend: 'up' as const,
      icon: '💰',
    },
    {
      title: '转化率',
      value: '3.24%',
      change: '-2.4%',
      trend: 'down' as const,
      icon: '📊',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
              AI
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Data Dashboard
            </h1>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="outline" className="hover:scale-105 transition-transform">
                登录
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 transition-transform">
                注册
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <div className="animate-fade-in">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            企业级 AI 数据分析平台
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            实时监控业务数据，智能分析趋势，助力数据驱动决策
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-lg px-8 hover:scale-105 transition-transform">
                免费试用 →
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="text-lg px-8 hover:scale-105 transition-transform">
                查看演示
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.title}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <StatsCard {...stat} />
            </div>
          ))}
        </div>
      </section>

      {/* Charts Section */}
      <section id="demo" className="max-w-7xl mx-auto px-6 py-8">
        <h3 className="text-3xl font-bold text-gray-900 mb-6">实时数据分析</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartPlaceholder
            title="用户增长趋势"
            description="过去 30 天用户注册量"
            type="line"
          />
          <ChartPlaceholder
            title="收入分布"
            description="按产品类别统计"
            type="bar"
          />
          <ChartPlaceholder
            title="地域分布"
            description="用户地理位置分布"
            type="map"
          />
          <ChartPlaceholder
            title="设备占比"
            description="移动端 vs 桌面端"
            type="pie"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h3 className="text-3xl font-bold text-gray-900 mb-12 text-center">核心功能</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '🚀',
              title: '实时数据',
              description: '毫秒级数据更新，实时掌握业务动态',
            },
            {
              icon: '🤖',
              title: 'AI 分析',
              description: '智能算法预测趋势，提供决策建议',
            },
            {
              icon: '📱',
              title: '多端适配',
              description: '完美支持桌面、平板、移动设备',
            },
            {
              icon: '🔒',
              title: '安全可靠',
              description: '企业级加密，数据安全有保障',
            },
            {
              icon: '📊',
              title: '可视化',
              description: '丰富的图表类型，数据一目了然',
            },
            {
              icon: '⚡',
              title: '高性能',
              description: '优化架构，处理海量数据不卡顿',
            },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h4>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">© 2026 AI Data Dashboard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
