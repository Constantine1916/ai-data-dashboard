import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 text-center">
        <h1 className="text-4xl font-semibold m-0">AI Data Dashboard</h1>
      </header>
      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <div className="text-center space-y-6">
            <p className="text-xl text-gray-800">
              欢迎使用 AI 数据仪表板
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/login">
                <Button>登录</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">注册</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
