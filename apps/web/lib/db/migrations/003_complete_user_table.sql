-- 完整的用户表创建脚本（适用于 Supabase）
-- 如果表已存在，会跳过创建；如果字段已存在，会跳过添加

-- 创建用户表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);

-- 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器（如果不存在）
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 添加注释（可选，帮助理解表结构）
COMMENT ON TABLE users IS '用户表，存储用户基本信息和认证信息';
COMMENT ON COLUMN users.id IS '用户唯一标识符（UUID）';
COMMENT ON COLUMN users.email IS '用户邮箱（唯一）';
COMMENT ON COLUMN users.password_hash IS '密码哈希值（bcrypt）';
COMMENT ON COLUMN users.name IS '用户姓名';
COMMENT ON COLUMN users.role IS '用户角色：admin 或 user';
COMMENT ON COLUMN users.email_verified IS '邮箱是否已验证';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '更新时间';
