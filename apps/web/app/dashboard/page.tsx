'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

function DashboardContent() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">仪表板</h1>
              <Button onClick={logout} variant="outline">
                登出
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">欢迎回来！</h2>
                <p className="text-gray-600">
                  <strong>姓名：</strong>{user?.name}
                </p>
                <p className="text-gray-600">
                  <strong>邮箱：</strong>{user?.email}
                </p>
                <p className="text-gray-600">
                  <strong>角色：</strong>{user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
