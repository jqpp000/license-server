# 🔐 授权码管理系统

一个功能完整、界面美观的授权码管理系统，支持创建、验证、管理和监控软件授权码。

## ✨ 功能特性

### 🎯 核心功能
- ✅ **创建授权码** - 生成唯一的授权码，支持自定义有效期和用户数
- ✅ **验证授权码** - 实时验证授权码的有效性
- ✅ **续费授权码** - 延长授权码有效期，支持精确到分钟的时间设置
- ✅ **管理授权码** - 禁用、删除、恢复授权码状态
- ✅ **搜索筛选** - 支持按授权码、客户名称、邮箱搜索和状态筛选

### 🎨 界面特性
- 🌙 **深色科技主题** - 现代化的深色界面设计
- 📱 **响应式布局** - 支持桌面端和移动端
- 🎭 **收起展开** - 授权码列表支持收起展开，节省空间
- 📋 **一键复制** - 快速复制授权码到剪贴板
- 🔍 **实时搜索** - 输入即搜索，无需点击按钮
- 📊 **分页显示** - 每页显示10条记录，支持翻页

### 🛠️ 技术特性
- 🗄️ **Supabase数据库** - 使用PostgreSQL数据库，数据持久化存储
- ☁️ **Vercel部署** - 无服务器架构，自动扩展
- 🔒 **安全验证** - 完整的授权码验证机制
- 📈 **状态管理** - 支持激活、禁用、删除、过期状态

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/jqpp000/license-server.git
cd license-server
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置Supabase
1. 访问 [Supabase](https://supabase.com) 创建项目
2. 获取项目URL和API密钥
3. 在Supabase控制台执行以下SQL创建数据表：

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

-- 创建索引
CREATE INDEX idx_licenses_license_key ON licenses(license_key);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_expire_date ON licenses(expire_date);
```

### 4. 配置环境变量
在Vercel项目设置中添加以下环境变量：
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 5. 部署到Vercel
```bash
vercel --prod
```

## 📖 使用指南

### 管理界面
访问 `https://your-domain.vercel.app/admin-friendly.html` 进入管理界面。

### API接口

#### 创建授权码
```bash
POST /api/add-license
Content-Type: application/json

{
  "customerName": "客户名称",
  "customerEmail": "customer@example.com",
  "expireDays": 365,
  "maxUsers": 10
}
```

#### 验证授权码
```bash
POST /api/validate-license
Content-Type: application/json

{
  "licenseKey": "ADS-XXXXXXXXXXXX"
}
```

#### 续费授权码
```bash
POST /api/renew-license
Content-Type: application/json

{
  "licenseKey": "ADS-XXXXXXXXXXXX",
  "newExpireDate": "2025-12-31T23:59:59.000Z",
  "newMaxUsers": 20
}
```

#### 管理授权码
```bash
POST /api/disable-license
Content-Type: application/json

{
  "license_key": "ADS-XXXXXXXXXXXX",
  "action": "disable" // disable, delete, enable
}
```

#### 获取授权码列表
```bash
GET /api/list-licenses
```

## 🎯 使用场景

### 软件授权
- 桌面应用程序授权
- 移动应用程序授权
- Web应用程序授权
- SaaS服务订阅

### 功能控制
- 用户数量限制
- 功能模块控制
- 时间限制管理
- 地域访问控制

## 🔧 集成示例

### JavaScript客户端
```javascript
// 验证授权码
async function validateLicense(licenseKey) {
  const response = await fetch('https://your-domain.vercel.app/api/validate-license', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseKey })
  });
  
  const result = await response.json();
  return result.valid;
}

// 使用示例
const isValid = await validateLicense('ADS-XXXXXXXXXXXX');
if (isValid) {
  console.log('授权码有效');
} else {
  console.log('授权码无效或已过期');
}
```

### Python客户端
```python
import requests

def validate_license(license_key):
    url = 'https://your-domain.vercel.app/api/validate-license'
    data = {'licenseKey': license_key}
    
    response = requests.post(url, json=data)
    result = response.json()
    
    return result.get('valid', False)

# 使用示例
if validate_license('ADS-XXXXXXXXXXXX'):
    print('授权码有效')
else:
    print('授权码无效或已过期')
```

## 📊 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   客户端应用     │    │   授权服务器     │    │   Supabase      │
│                 │    │                 │    │   PostgreSQL    │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ 授权码验证   │◄├────┤ │ API接口     │◄├────┤ │ 数据存储     │ │
│ │ 功能控制     │ │    │ │ 业务逻辑     │ │    │ │ 状态管理     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛡️ 安全特性

- ✅ **HTTPS传输** - 所有API调用使用HTTPS加密
- ✅ **状态验证** - 多重状态检查（激活、过期、禁用）
- ✅ **时间验证** - 精确到分钟的有效期控制
- ✅ **用户限制** - 支持最大用户数控制
- ✅ **审计日志** - 完整的操作记录和状态变更

## 📈 监控和维护

### 系统状态监控
- 实时查看授权码数量统计
- 监控各状态授权码分布
- 查看系统运行状态

### 数据管理
- 支持授权码搜索和筛选
- 批量操作（展开/收起所有）
- 数据导出和备份

## 🔄 更新日志

### v1.0.0 (2025-01-20)
- ✅ 基础授权码管理功能
- ✅ Supabase数据库集成
- ✅ 现代化管理界面
- ✅ 搜索和分页功能
- ✅ 收起展开列表显示
- ✅ 一键复制功能
- ✅ 精确时间控制

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 技术支持

如有问题或建议，请：
- 提交 [Issue](https://github.com/jqpp000/license-server/issues)
- 发送邮件至项目维护者

## 🙏 致谢

感谢以下开源项目：
- [Supabase](https://supabase.com) - 数据库服务
- [Vercel](https://vercel.com) - 部署平台
- [Node.js](https://nodejs.org) - 运行时环境

---

⭐ 如果这个项目对你有帮助，请给个星标支持！
