# 🗄️ Supabase 数据库设置指南

## 📋 完整设置步骤

### 1. 创建 Supabase 项目

#### 1.1 访问 Supabase
1. 打开浏览器，访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project" 或 "Sign up"
3. 使用 GitHub、Google 或邮箱注册账号

#### 1.2 创建新项目
1. 登录后，点击 "New Project"
2. 选择组织（或创建新组织）
3. 填写项目信息：
   - **Name**: `license-server` (或您喜欢的名称)
   - **Database Password**: 设置一个强密码（请记住此密码）
   - **Region**: 选择离您最近的区域
4. 点击 "Create new project"
5. 等待项目创建完成（约2-3分钟）

### 2. 获取 API 密钥

#### 2.1 进入项目设置
1. 项目创建完成后，进入项目控制台
2. 点击左侧菜单的 "Settings" (齿轮图标)
3. 选择 "API"

#### 2.2 复制密钥信息
在 API 页面中，您会看到：
- **Project URL**: `https://xxx.supabase.co`
- **anon public key**: `eyJhbGciOiJIUzI1NiIs...` (很长的字符串)

**请复制这两个值，稍后需要配置到 Vercel 中！**

### 3. 初始化数据库

#### 3.1 打开 SQL 编辑器
1. 在 Supabase 控制台中，点击左侧菜单的 "SQL Editor"
2. 点击 "New query"

#### 3.2 执行重置脚本
1. 复制 `supabase-reset.sql` 文件中的所有内容
2. 粘贴到 SQL 编辑器中
3. 点击 "Run" 按钮执行脚本

#### 3.3 验证执行结果
执行成功后，您应该看到：
- 两个表创建成功：`licenses` 和 `users`
- 数据插入成功：
  - 1 个示例授权码
  - 2 个默认用户（admin 和 operator）

### 4. 配置数据库权限

#### 4.1 设置 RLS (Row Level Security)
1. 在 SQL 编辑器中执行以下命令：

```sql
-- 启用 RLS
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建策略（允许所有操作，生产环境请根据需要调整）
CREATE POLICY "Allow all operations on licenses" ON licenses FOR ALL USING (true);
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
```

#### 4.2 验证表结构
执行以下查询验证表结构：

```sql
-- 查看表结构
\d licenses
\d users

-- 查看数据
SELECT * FROM licenses;
SELECT * FROM users;
```

### 5. 测试数据库连接

#### 5.1 在 Supabase 控制台测试
1. 进入 "Table Editor"
2. 查看 `licenses` 和 `users` 表
3. 确认数据已正确插入

#### 5.2 记录重要信息
请记录以下信息，用于 Vercel 配置：

```
SUPABASE_URL = https://your-project-id.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔧 故障排除

### 常见问题

#### 1. 项目创建失败
- 检查网络连接
- 尝试更换浏览器
- 确认邮箱已验证

#### 2. SQL 脚本执行失败
- 检查 SQL 语法
- 确认在正确的项目中执行
- 查看错误信息并修正

#### 3. 找不到 API 密钥
- 确认在正确的项目中
- 检查是否在 "Settings" → "API" 页面
- 刷新页面重试

### 验证清单

- [ ] Supabase 项目创建成功
- [ ] 获取到 Project URL
- [ ] 获取到 anon public key
- [ ] SQL 脚本执行成功
- [ ] licenses 表创建成功
- [ ] users 表创建成功
- [ ] 示例数据插入成功
- [ ] 可以查看表数据

## 🚀 下一步

完成 Supabase 设置后，请继续：
1. 部署到 Vercel
2. 在 Vercel 中配置环境变量
3. 测试应用功能

---

**需要帮助？** 如果遇到问题，请检查：
1. 网络连接是否正常
2. Supabase 项目状态是否为 "Active"
3. SQL 脚本是否完整复制
4. 浏览器控制台是否有错误信息
