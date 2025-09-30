-- Supabase数据库初始化脚本
-- 在Supabase控制台的SQL编辑器中执行此脚本

-- 创建licenses表
CREATE TABLE IF NOT EXISTS licenses (
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expire_date ON licenses(expire_date);

-- 插入示例数据
INSERT INTO licenses (license_key, customer_name, customer_email, expire_date, max_users, status, features) 
VALUES (
  'ADS-EXAMPLE123456789',
  '示例客户',
  'example@example.com',
  '2026-12-31 23:59:59+00',
  10,
  'active',
  '{"ads_management": true, "user_management": true, "reports": true, "api_access": true}'::jsonb
) ON CONFLICT (license_key) DO NOTHING;

-- 创建用户表（用于认证）
CREATE TABLE IF NOT EXISTS users (
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

-- 插入默认用户
INSERT INTO users (username, password_hash, role, permissions) 
VALUES (
  'admin',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', -- admin123
  'admin',
  ARRAY['read', 'write', 'delete', 'manage_users', 'manage_licenses']
) ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password_hash, role, permissions) 
VALUES (
  'operator',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', -- operator123
  'operator',
  ARRAY['read', 'write']
) ON CONFLICT (username) DO NOTHING;
