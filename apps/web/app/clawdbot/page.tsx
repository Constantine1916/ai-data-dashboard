import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clawdbot AI Agent - 企业级AI数据分析助手 | AI Data Dashboard',
  description: 'Clawdbot是一款强大的开源AI Agent框架，支持多渠道消息集成(Telegram、WhatsApp、Discord)，企业级数据分析，自动化工作流。立即体验Clawdbot AI助手的强大功能！',
  keywords: [
    'Clawdbot',
    'AI Agent',
    'AI助手',
    'Telegram Bot',
    'WhatsApp Bot',
    'Discord Bot',
    '数据分析',
    'AI数据分析',
    '企业AI',
    'ChatGPT替代品',
    'Claude AI',
    '开源AI',
    'AI自动化',
    '智能对话',
    'AI工作流',
    '多渠道AI',
    'Next.js AI',
    'TypeScript AI'
  ],
  openGraph: {
    title: 'Clawdbot AI Agent - 企业级AI数据分析助手',
    description: '使用Clawdbot AI Agent构建智能数据分析系统，支持多渠道集成、自动化工作流、企业级数据可视化',
    type: 'website',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clawdbot AI Agent - 企业级AI数据分析',
    description: '强大的开源AI Agent框架，支持Telegram、WhatsApp、Discord等多渠道',
  },
  alternates: {
    canonical: 'https://ai-data-dashboard.vercel.app/clawdbot'
  }
}

export default function ClawdbotPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Clawdbot AI Agent
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-4">
            企业级AI数据分析助手
          </p>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            使用 Clawdbot 构建智能数据分析系统，支持 Telegram、WhatsApp、Discord 等多渠道集成，
            让AI助手自动化处理您的数据分析任务
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/clawdbot/clawdbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              🚀 开始使用 Clawdbot
            </a>
            <a
              href="https://docs.clawd.bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 bg-white hover:bg-gray-50 text-blue-600 font-semibold rounded-lg border-2 border-blue-600 transition-colors"
            >
              📚 查看文档
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 bg-white rounded-2xl shadow-lg my-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          为什么选择 Clawdbot AI Agent？
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Clawdbot AI 应用场景
        </h2>
        <div className="max-w-4xl mx-auto space-y-6">
          {useCases.map((useCase, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <span className="text-2xl">{useCase.icon}</span>
                {useCase.title}
              </h3>
              <p className="text-gray-600">{useCase.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integration Section */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white my-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            多渠道 AI 集成
          </h2>
          <p className="text-xl mb-8">
            Clawdbot 支持主流消息平台，让您的 AI 助手无处不在
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-lg">
            <span className="px-6 py-2 bg-white/20 rounded-full">📱 Telegram</span>
            <span className="px-6 py-2 bg-white/20 rounded-full">💬 WhatsApp</span>
            <span className="px-6 py-2 bg-white/20 rounded-full">🎮 Discord</span>
            <span className="px-6 py-2 bg-white/20 rounded-full">💼 Slack</span>
            <span className="px-6 py-2 bg-white/20 rounded-full">📧 Email</span>
            <span className="px-6 py-2 bg-white/20 rounded-full">🌐 Web API</span>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          现代化技术栈
        </h2>
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Clawdbot 核心</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✅ TypeScript 全栈开发</li>
                <li>✅ Node.js 运行时</li>
                <li>✅ Claude AI / GPT 支持</li>
                <li>✅ 插件化架构</li>
                <li>✅ 企业级安全</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-purple-600">数据分析集成</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✅ Next.js 15 前端</li>
                <li>✅ PostgreSQL 数据库</li>
                <li>✅ Tailwind CSS 样式</li>
                <li>✅ Vercel 部署</li>
                <li>✅ 实时数据可视化</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-blue-50 to-purple-50 p-12 rounded-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            立即开始使用 Clawdbot AI
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            5分钟快速部署，打造您的专属 AI 数据分析助手
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/clawdbot/clawdbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              ⭐ Star on GitHub
            </a>
            <a
              href="https://docs.clawd.bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 bg-white hover:bg-gray-50 text-blue-600 font-semibold rounded-lg border-2 border-blue-600 transition-colors"
            >
              📖 阅读快速开始指南
            </a>
          </div>
        </div>
      </section>

      {/* Footer SEO Links */}
      <footer className="container mx-auto px-4 py-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-4">关于 Clawdbot</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="https://github.com/clawdbot/clawdbot" className="hover:text-blue-600">GitHub 仓库</a></li>
                <li><a href="https://docs.clawd.bot" className="hover:text-blue-600">官方文档</a></li>
                <li><a href="https://discord.com/invite/clawd" className="hover:text-blue-600">Discord 社区</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">资源</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="https://docs.clawd.bot/getting-started" className="hover:text-blue-600">快速开始</a></li>
                <li><a href="https://docs.clawd.bot/guides" className="hover:text-blue-600">使用指南</a></li>
                <li><a href="https://clawdhub.com" className="hover:text-blue-600">技能市场</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">相关项目</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="/" className="hover:text-blue-600">AI Data Dashboard</a></li>
                <li><a href="https://github.com/Constantine1916" className="hover:text-blue-600">更多项目</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
            <p>© 2026 AI Data Dashboard | Powered by <a href="https://github.com/clawdbot/clawdbot" className="text-blue-600 hover:underline">Clawdbot</a></p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: '🤖',
    title: 'AI Agent 框架',
    description: '基于 Claude/GPT 的智能对话系统，支持自定义工作流和自动化任务'
  },
  {
    icon: '📊',
    title: '数据分析集成',
    description: '与 PostgreSQL、Next.js 无缝集成，实时数据分析和可视化'
  },
  {
    icon: '💬',
    title: '多渠道支持',
    description: 'Telegram、WhatsApp、Discord、Slack 等主流平台一键集成'
  },
  {
    icon: '🔌',
    title: '插件化架构',
    description: '灵活的插件系统，轻松扩展 AI 能力和业务功能'
  },
  {
    icon: '🔒',
    title: '企业级安全',
    description: '用户认证、权限管理、数据加密，保护您的数据安全'
  },
  {
    icon: '⚡',
    title: '高性能',
    description: 'TypeScript 全栈开发，Vercel 边缘部署，毫秒级响应'
  }
]

const useCases = [
  {
    icon: '📈',
    title: '智能数据分析',
    description: '通过 Telegram/WhatsApp 发送自然语言查询，AI 自动生成数据报表和可视化图表'
  },
  {
    icon: '🔔',
    title: '实时监控告警',
    description: '配置业务指标监控规则，Clawdbot 自动检测异常并通过消息渠道实时通知'
  },
  {
    icon: '📝',
    title: '自动化报告',
    description: '定时生成周报、月报，自动发送到指定渠道，节省人工统计时间'
  },
  {
    icon: '🎯',
    title: '客户服务',
    description: '集成客服系统，AI 自动回答常见问题，智能路由到人工客服'
  },
  {
    icon: '🔄',
    title: '工作流自动化',
    description: '触发器 + 动作，自动化处理业务流程，提升团队效率'
  }
]
