-- Supabase数据库重置脚本
-- 在Supabase控制台的SQL编辑器中执行此脚本
-- ⚠️ 警告：此脚本将删除所有现有数据！

-- 1. 删除现有表（如果存在）
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;

-- 2. 删除相关索引（如果存在）
DROP INDEX IF EXISTS idx_licenses_license_key;
DROP INDEX IF EXISTS idx_licenses_status;
DROP INDEX IF EXISTS idx_licenses_expire_date;

-- 3. 重新创建licenses表
CREATE TABLE licenses (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100),
  expire_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_users INTEGER DEFAULT 10,
  status VARCHAR(20) DEFAULT 'active',
  features JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  renewed_at TIMESTAMP WITH TIME ZONE,
  disabled_at TIMESTAMP WITH TIME ZONE
);

-- 4. 重新创建users表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'operator',
  active BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  totp_secret VARCHAR(255),
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- 5. 创建索引
CREATE INDEX idx_licenses_license_key ON licenses(license_key);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_expire_date ON licenses(expire_date);
CREATE INDEX idx_users_username ON users(username);

-- 6. 插入示例授权码数据
INSERT INTO licenses (license_key, customer_name, customer_email, expire_date, max_users, status, features) 
VALUES (
  'ADS-EXAMPLE123456789',
  '示例客户',
  'example@example.com',
  '2026-12-31 23:59:59+00',
  10,
  'active',
  '{"ads_management": true, "user_management": true, "reports": true, "api_access": true}'::jsonb
);

-- 7. 插入默认用户（密码已加密）
INSERT INTO users (username, password_hash, role, permissions) 
VALUES (
  'admin',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', -- admin123
  'admin',
  ARRAY['read', 'write', 'delete', 'manage_users', 'manage_licenses']
);

INSERT INTO users (username, password_hash, role, permissions) 
VALUES (
  'operator',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', -- operator123
  'operator',
  ARRAY['read', 'write']
);

-- 8. 验证数据插入
SELECT 'licenses表数据:' as table_name, count(*) as record_count FROM licenses
UNION ALL
SELECT 'users表数据:' as table_name, count(*) as record_count FROM users;
