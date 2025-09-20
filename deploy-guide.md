# 传统服务器部署指南

## 🖥️ 服务器配置要求

- **CPU**: 1 vCPU (推荐 2 vCPU)
- **内存**: 512 MB (推荐 1 GB)
- **存储**: 10 GB (推荐 20 GB)
- **系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **网络**: 公网IP，开放80和443端口

## 🚀 部署步骤

### 1. 连接服务器
```bash
ssh root@your-server-ip
```

### 2. 更新系统
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 3. 安装Node.js
```bash
# 使用NodeSource仓库安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 4. 安装PM2进程管理器
```bash
sudo npm install -g pm2
```

### 5. 部署应用
```bash
# 克隆项目
git clone https://github.com/jqpp000/license-server.git
cd license-server

# 安装依赖
npm install

# 启动应用
pm2 start server.js --name license-server

# 设置开机自启
pm2 startup
pm2 save
```

### 6. 配置Nginx (可选但推荐)

#### 安装Nginx
```bash
sudo apt install nginx -y
```

#### 创建配置文件
```bash
sudo nano /etc/nginx/sites-available/license-server
```

#### 配置内容
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

#### 启用配置
```bash
sudo ln -s /etc/nginx/sites-available/license-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. 配置SSL证书 (推荐)
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取SSL证书
sudo certbot --nginx -d your-domain.com
```

## 🔧 管理命令

### PM2管理
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs license-server

# 重启服务
pm2 restart license-server

# 停止服务
pm2 stop license-server

# 删除服务
pm2 delete license-server
```

### 应用管理
```bash
# 进入项目目录
cd /path/to/license-server

# 查看数据文件
ls -la data/

# 备份数据
cp data/licenses.json data/licenses.json.backup

# 查看应用日志
tail -f ~/.pm2/logs/license-server-out.log
```

## 📊 监控和维护

### 系统监控
```bash
# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看网络连接
netstat -tlnp
```

### 应用监控
```bash
# PM2监控
pm2 monit

# 查看实时日志
pm2 logs license-server --lines 100
```

## 🔒 安全建议

1. **防火墙配置**
```bash
# Ubuntu
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
```

2. **定期备份**
```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp data/licenses.json "backups/licenses_$DATE.json"
# 保留最近30天的备份
find backups/ -name "licenses_*.json" -mtime +30 -delete
EOF

chmod +x backup.sh

# 添加到crontab (每天凌晨2点备份)
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

3. **更新维护**
```bash
# 定期更新系统
sudo apt update && sudo apt upgrade -y

# 重启应用
pm2 restart license-server
```

## 🌐 访问地址

- **主页**: http://your-domain.com
- **管理界面**: http://your-domain.com/admin
- **API文档**: http://your-domain.com/api/list-licenses

## 📞 技术支持

如果遇到问题，请检查：
1. PM2进程状态: `pm2 status`
2. 应用日志: `pm2 logs license-server`
3. Nginx状态: `sudo systemctl status nginx`
4. 端口占用: `netstat -tlnp | grep :3000`
