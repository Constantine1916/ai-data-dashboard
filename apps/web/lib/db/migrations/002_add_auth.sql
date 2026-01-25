-- 认证功能数据库迁移
-- 添加密码字段到用户表，支持用户认证

-- 如果 users 表已存在但没有 password_hash 字段，则添加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
    
    -- 为已有用户设置一个默认密码（实际应用中应该要求用户重置密码）
    -- UPDATE users SET password_hash = '$2b$10$...' WHERE password_hash IS NULL;
  END IF;
END $$;

-- 添加邮箱验证字段（可选）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 确保 email 字段有唯一索引（如果还没有）
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);

-- 添加密码字段的检查约束（可选，确保密码不为空）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_password_hash_not_null'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_password_hash_not_null 
    CHECK (password_hash IS NOT NULL OR role = 'admin');
  END IF;
END $$;
