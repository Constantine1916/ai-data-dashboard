export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 text-center">
        <h1 className="text-4xl font-semibold m-0">AI Data Dashboard1</h1>
      </header>
      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <p className="text-xl text-gray-800 text-center">
            欢迎使用 AI 数据仪表板
          </p>
        </div>
      </main>
    </div>
  )
}
