# 🚀 部署指南

## 部署选项

本系统支持多种部署方式，推荐使用Vercel进行快速部署。

## 方式一：Vercel部署（推荐）

### 1. 准备项目
```bash
# 克隆项目
git clone https://github.com/jqpp000/license-server.git
cd license-server

# 安装依赖
npm install
```

### 2. 配置Supabase数据库

#### 2.1 创建Supabase项目
1. 访问 [Supabase](https://supabase.com)
2. 注册账号并创建新项目
3. 等待项目创建完成（约2-3分钟）

#### 2.2 获取API密钥
1. 进入项目 → Settings → API
2. 复制以下信息：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`

#### 2.3 创建数据表
1. 进入项目 → SQL Editor
2. 创建新查询，执行以下SQL：

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

-- 创建索引
CREATE INDEX idx_licenses_license_key ON licenses(license_key);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_expire_date ON licenses(expire_date);
```

### 3. 部署到Vercel

#### 3.1 安装Vercel CLI
```bash
npm install -g vercel
```

#### 3.2 登录Vercel
```bash
vercel login
```

#### 3.3 部署项目
```bash
vercel --prod
```

#### 3.4 配置环境变量
1. 进入Vercel项目控制台
2. 进入 Settings → Environment Variables
3. 添加以下环境变量：

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = your-anon-key
```

#### 3.5 重新部署
```bash
vercel --prod
```

### 4. 验证部署
1. 访问部署地址：`https://your-project.vercel.app`
2. 进入管理界面：`https://your-project.vercel.app/admin-friendly.html`
3. 点击"检查系统状态"验证连接

## 方式二：传统服务器部署

### 1. 服务器要求
- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **Node.js**: 18.x 或更高版本
- **内存**: 至少 512MB（推荐 1GB）
- **存储**: 至少 10GB（推荐 20GB）
- **网络**: 公网IP，开放80和443端口

### 2. 服务器配置

#### 2.1 更新系统
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yam update -y
```

#### 2.2 安装Node.js
```bash
# 使用NodeSource仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### 2.3 安装PM2进程管理器
```bash
sudo npm install -g pm2
```

### 3. 部署应用

#### 3.1 克隆项目
```bash
git clone https://github.com/jqpp000/license-server.git
cd license-server
```

#### 3.2 安装依赖
```bash
npm install
```

#### 3.3 配置环境变量
```bash
# 创建环境变量文件
cat > .env << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NODE_ENV=production
EOF
```

#### 3.4 启动应用
```bash
# 使用PM2启动
pm2 start server.js --name license-server

# 设置开机自启
pm2 startup
pm2 save
```

### 4. 配置Nginx（可选但推荐）

#### 4.1 安装Nginx
```bash
sudo apt install nginx -y
```

#### 4.2 创建配置文件
```bash
sudo nano /etc/nginx/sites-available/license-server
```

#### 4.3 配置内容
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4.4 启用配置
```bash
sudo ln -s /etc/nginx/sites-available/license-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. 配置SSL证书（推荐）

#### 5.1 安装Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

#### 5.2 获取SSL证书
```bash
sudo certbot --nginx -d your-domain.com
```

## 方式三：Docker部署

### 1. 创建Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. 构建镜像
```bash
docker build -t license-server .
```

### 3. 运行容器
```bash
docker run -d \
  --name license-server \
  -p 3000:3000 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_ANON_KEY=your-anon-key \
  license-server
```

## 监控和维护

### 1. 查看应用状态
```bash
# PM2状态
pm2 status

# 查看日志
pm2 logs license-server

# 重启服务
pm2 restart license-server
```

### 2. 系统监控
```bash
# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

### 3. 备份数据
```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
# 备份Supabase数据（通过API导出）
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "https://your-project.supabase.co/rest/v1/licenses" \
     > "backups/licenses_$DATE.json"
EOF

chmod +x backup.sh
```

## 故障排除

### 常见问题

#### 1. 数据库连接失败
- 检查环境变量是否正确设置
- 确认Supabase项目状态为"Active"
- 验证API密钥是否完整

#### 2. 授权码验证失败
- 检查授权码格式是否正确
- 确认授权码状态为"active"
- 验证过期时间是否有效

#### 3. 部署失败
- 检查Node.js版本是否兼容
- 确认所有依赖已正确安装
- 查看部署日志获取详细错误信息

### 调试命令
```bash
# 查看PM2日志
pm2 logs license-server --lines 100

# 查看Nginx状态
sudo systemctl status nginx

# 测试API接口
curl -X GET https://your-domain.com/api/list-licenses
```

## 性能优化

### 1. 数据库优化
- 定期清理过期的授权码
- 优化查询索引
- 监控数据库性能

### 2. 应用优化
- 启用Gzip压缩
- 配置CDN加速
- 优化静态资源

### 3. 监控告警
- 设置系统资源监控
- 配置应用性能监控
- 建立故障告警机制

## 安全建议

1. **定期更新**: 保持系统和依赖包的最新版本
2. **访问控制**: 限制管理界面的访问权限
3. **数据备份**: 定期备份重要数据
4. **监控日志**: 监控异常访问和操作
5. **HTTPS**: 生产环境必须使用HTTPS

---

按照本指南，你可以成功部署授权码管理系统。如有问题，请参考故障排除部分或提交Issue。
