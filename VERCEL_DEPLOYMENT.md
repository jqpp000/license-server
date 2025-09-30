# 🚀 Vercel + Supabase 部署指南

## 📋 部署步骤

### 1. 准备 Supabase 数据库

#### 1.1 创建 Supabase 项目
1. 访问 [https://supabase.com](https://supabase.com)
2. 注册账号并创建新项目
3. 等待项目创建完成（约2-3分钟）

#### 1.2 获取 API 密钥
1. 进入项目 → Settings → API
2. 复制以下信息：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`

#### 1.3 初始化数据库
1. 进入项目 → SQL Editor
2. 创建新查询，执行 `supabase-setup.sql` 文件中的SQL脚本
3. 确认表创建成功

### 2. 部署到 Vercel

#### 2.1 安装 Vercel CLI
```bash
npm install -g vercel
```

#### 2.2 登录 Vercel
```bash
vercel login
```

#### 2.3 部署项目
```bash
cd vercel-license-server
vercel --prod
```

#### 2.4 配置环境变量
1. 进入 Vercel 项目控制台
2. 进入 Settings → Environment Variables
3. 添加以下环境变量：

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = your-anon-key
JWT_SECRET = your-super-secret-jwt-key-here
NODE_ENV = production
```

#### 2.5 重新部署
```bash
vercel --prod
```

### 3. 验证部署

#### 3.1 访问应用
- 登录页面: `https://your-project.vercel.app/login`
- 管理后台: `https://your-project.vercel.app/admin`
- 健康检查: `https://your-project.vercel.app/health`

#### 3.2 测试功能
1. 访问登录页面
2. 使用默认账户登录：
   - 用户名: `admin`
   - 密码: `admin123`
3. 测试授权码管理功能

## 🔧 配置说明

### 环境变量
- `SUPABASE_URL`: Supabase项目URL
- `SUPABASE_ANON_KEY`: Supabase匿名密钥
- `JWT_SECRET`: JWT令牌密钥（建议使用强密码）
- `NODE_ENV`: 环境模式（production）

### 数据库表结构
- `licenses`: 授权码表
- `users`: 用户表

## 🎯 功能特性

### ✅ 已实现功能
- 用户认证系统
- 授权码管理（创建、验证、续费）
- 双因子认证支持
- 管理界面
- API接口
- 安全中间件

### 🔑 默认账户
- **管理员**: admin / admin123
- **操作员**: operator / operator123

## 🚨 注意事项

1. **安全性**: 生产环境请修改默认密码
2. **JWT密钥**: 使用强随机密钥
3. **数据库**: 定期备份重要数据
4. **监控**: 关注应用性能和错误日志

## 📞 支持

如有问题，请检查：
1. 环境变量是否正确配置
2. Supabase数据库连接是否正常
3. Vercel部署日志中的错误信息
