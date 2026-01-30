import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clawdbot 集成指南 - AI Data Dashboard',
  description: '了解如何在 AI Data Dashboard 中使用 Clawdbot。Clawdbot 是一个开源的 AI 助手框架，支持 Telegram、WhatsApp、Discord 等多个平台。',
  keywords: [
    'Clawdbot',
    'AI助手',
    'Telegram机器人',
    'WhatsApp机器人',
    'Discord机器人',
    '数据可视化',
    '开源工具',
    'TypeScript',
    'Next.js'
  ],
  openGraph: {
    title: 'Clawdbot 集成 - AI Data Dashboard',
    description: '在数据分析项目中使用 Clawdbot 搭建自己的 AI 助手',
    type: 'website',
  }
}

export default function ClawdbotPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <a href="/" className="text-gray-600 hover:text-gray-900">← 返回首页</a>
        </div>
      </div>

      {/* Main Content */}
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">
            在 AI Data Dashboard 中使用 Clawdbot
          </h1>
          <p className="text-xl text-gray-600">
            Clawdbot 是一个挺有意思的开源项目，可以让你在 Telegram、WhatsApp 这些地方跟自己的数据聊天。
            这篇文章记录一下怎么把它接入我们的数据分析系统。
          </p>
        </header>

        {/* What is Clawdbot */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Clawdbot 是什么？</h2>
          <p className="text-gray-700 mb-4">
            简单说，就是一个用 TypeScript 写的 AI 助手框架。你可以用它做很多事情：
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li>在 Telegram 里发消息，让它帮你查数据</li>
            <li>设置定时任务，自动生成报告发到你手机</li>
            <li>接入 Discord/Slack，在团队里共享数据分析</li>
            <li>写自定义命令，自动化一些重复的工作</li>
          </ul>
        </section>

        {/* Why Use It */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">为什么用这个？</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 mb-4">
              说实话，一开始也没想用。但是后来发现几个好处：
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">📱 随时查数据</h3>
                <p className="text-gray-600">
                  不用每次都打开电脑登录后台。在手机上发个消息就能看到最新的数据，挺方便的。
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">🔔 自动提醒</h3>
                <p className="text-gray-600">
                  可以设置一些监控规则，比如用户数突然掉了 10%，自动发消息通知你。
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">🛠️ 开源免费</h3>
                <p className="text-gray-600">
                  代码在 GitHub 上，想怎么改就怎么改。不用担心被收费或者服务跑路。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How We Use It */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">我们怎么用的</h2>
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold mb-2">每天早上自动发日报</h3>
              <p className="text-gray-700">
                设置了个定时任务，每天早上 9 点自动统计昨天的数据，发到 Telegram。
                这样不用特意去看后台，吃早饭的时候就能知道昨天的情况。
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold mb-2">随手查询具体数据</h3>
              <p className="text-gray-700">
                想看某个时间段的数据时，直接在 Telegram 里问一句"上周访问量多少"，
                它会自动查数据库然后回复。比打开电脑登录后台快多了。
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold mb-2">异常监控提醒</h3>
              <p className="text-gray-700">
                设置了几个监控指标，如果数据有异常波动会自动通知。
                这样出问题能第一时间知道，不用等到周报才发现。
              </p>
            </div>
          </div>
        </section>

        {/* Tech Details */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">技术实现</h2>
          <p className="text-gray-700 mb-4">
            项目本身用的是 Next.js + PostgreSQL，Clawdbot 的接入其实不复杂：
          </p>
          <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
            <pre className="text-sm">
{`// 在 API 路由里暴露查询接口
export async function POST(request: Request) {
  const { query } = await request.json()
  
  // 调用数据库查询
  const result = await db.query(
    'SELECT COUNT(*) FROM users WHERE created_at > $1',
    [query.startDate]
  )
  
  return Response.json(result)
}

// Clawdbot 配置文件里添加自定义命令
{
  "skills": {
    "data-query": {
      "enabled": true,
      "apiEndpoint": "https://your-dashboard.com/api/query"
    }
  }
}`}
            </pre>
          </div>
        </section>

        {/* Getting Started */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">想试试的话</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>
              去 <a href="https://github.com/clawdbot/clawdbot" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Clawdbot GitHub</a> 看看 README
            </li>
            <li>按照文档装一下（需要 Node.js 环境）</li>
            <li>创建个 Telegram Bot（在 BotFather 那里申请）</li>
            <li>配置好之后跟 bot 聊天测试一下</li>
            <li>写几个自定义命令接入你自己的数据</li>
          </ol>
          <p className="mt-4 text-gray-600">
            官方文档写得挺详细的，按步骤来一般 10 分钟能跑起来。
          </p>
        </section>

        {/* Supported Platforms */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">支持的平台</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {platforms.map((platform, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">{platform.icon}</div>
                <div className="font-semibold">{platform.name}</div>
                <div className="text-sm text-gray-600">{platform.status}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Resources */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">相关链接</h2>
          <ul className="space-y-2">
            <li>
              <a href="https://github.com/clawdbot/clawdbot" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                → Clawdbot GitHub 仓库
              </a>
            </li>
            <li>
              <a href="https://docs.clawd.bot" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                → 官方文档
              </a>
            </li>
            <li>
              <a href="https://discord.com/invite/clawd" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                → Discord 社区
              </a>
            </li>
            <li>
              <a href="https://clawdhub.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                → 技能市场（各种插件）
              </a>
            </li>
          </ul>
        </section>

        {/* Footer Note */}
        <footer className="mt-16 pt-8 border-t">
          <p className="text-gray-500 text-sm">
            这个页面记录了我们在项目中使用 Clawdbot 的经验。如果你也在做类似的数据分析项目，
            可以参考一下。有问题的话可以去他们的 Discord 问，社区还挺活跃的。
          </p>
          <p className="text-gray-500 text-sm mt-2">
            更新时间：2026年1月
          </p>
        </footer>
      </article>
    </div>
  )
}

const platforms = [
  { icon: '📱', name: 'Telegram', status: '完整支持' },
  { icon: '💬', name: 'WhatsApp', status: '完整支持' },
  { icon: '🎮', name: 'Discord', status: '完整支持' },
  { icon: '💼', name: 'Slack', status: '完整支持' },
  { icon: '📧', name: 'Signal', status: '完整支持' },
  { icon: '🌐', name: 'Web API', status: '完整支持' },
]
