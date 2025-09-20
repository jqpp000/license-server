# Supabase数据库设置指南

## 🚀 快速设置（5分钟完成）

### 1. 注册Supabase账户
1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project"
3. 使用GitHub账户登录（推荐）

### 2. 创建新项目
1. 点击 "New Project"
2. 填写项目信息：
   - **Name**: `license-server-db`
   - **Database Password**: 设置一个强密码（记住这个密码）
   - **Region**: 选择离你最近的区域（推荐 Singapore）
3. 点击 "Create new project"
4. 等待2-3分钟项目创建完成

### 3. 获取API密钥
1. 进入项目后，点击左侧菜单的 "Settings" → "API"
2. 复制以下信息：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. 创建数据表
1. 点击左侧菜单的 "SQL Editor"
2. 点击 "New query"
3. 复制粘贴以下SQL代码：

```sql
-- 创建licenses表
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
);

-- 创建索引以提高查询性能
CREATE INDEX idx_licenses_license_key ON licenses(license_key);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_expire_date ON licenses(expire_date);
```

4. 点击 "Run" 执行SQL

### 5. 配置Vercel环境变量
1. 进入你的Vercel项目
2. 点击 "Settings" → "Environment Variables"
3. 添加以下环境变量：

```
SUPABASE_URL = https://xxx.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. 点击 "Save"
5. 重新部署项目

### 6. 测试数据库连接
1. 访问你的Vercel项目
2. 进入管理界面：`https://你的域名.vercel.app/admin-friendly.html`
3. 点击 "检查系统状态"
4. 应该看到 "✅ 系统运行正常" 的消息

## 🔧 故障排除

### 问题1：数据库连接失败
**解决方案：**
- 检查环境变量是否正确设置
- 确认Supabase项目状态为 "Active"
- 检查网络连接

### 问题2：表不存在错误
**解决方案：**
- 确认SQL脚本已正确执行
- 检查表名是否为 "licenses"
- 重新运行SQL创建脚本

### 问题3：权限错误
**解决方案：**
- 确认使用的是 "anon public" 密钥
- 检查Row Level Security (RLS) 设置
- 在Supabase控制台的 "Authentication" → "Policies" 中确保表可访问

## 📊 Supabase免费版限制

- **数据库大小**: 500MB
- **带宽**: 50MB/月
- **API请求**: 50,000/月
- **并发连接**: 60

对于你的授权系统来说，这些限制完全够用！

## 🎯 下一步

1. 完成Supabase设置
2. 配置Vercel环境变量
3. 重新部署项目
4. 测试所有功能

完成后，你的授权系统将拥有真正的持久化存储！🎉
