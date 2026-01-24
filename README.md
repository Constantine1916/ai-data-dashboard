# AI Data Dashboard

一个基于 Next.js 的 AI 数据仪表板项目（Monorepo 架构）。

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: PostgreSQL
- **部署**: Vercel

## 项目结构

```
ai-data-dashboard/
├── apps/
│   └── web/          # Next.js 前端应用
├── packages/         # 共享包（待创建）
├── package.json      # Monorepo 根配置
└── README.md
```

## 开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
# 从根目录运行（推荐）
npm run dev

# 或者进入 apps/web 目录
cd apps/web
npm run dev
```

开发服务器将在 [http://localhost:3000](http://localhost:3000) 启动。

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm run start
```

## Monorepo 说明

本项目使用 npm workspaces 管理 monorepo：

- `apps/web`: Next.js 前端应用
- `packages/`: 共享包和工具（如需要）

## 下一步

1. ✅ 项目初始化为 Next.js monorepo
2. ⏳ 配置 PostgreSQL 数据库连接
3. ⏳ 开发 API 路由
4. ⏳ 配置 Vercel 部署
