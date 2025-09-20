# 📚 API 接口文档

## 基础信息

- **Base URL**: `https://your-domain.vercel.app`
- **Content-Type**: `application/json`
- **支持方法**: GET, POST, OPTIONS

## 接口列表

### 1. 创建授权码

**接口**: `POST /api/add-license`

**描述**: 创建新的授权码

**请求参数**:
```json
{
  "customerName": "客户名称",      // 必填
  "customerEmail": "邮箱地址",     // 可选
  "expireDays": 365,             // 可选，默认365天
  "maxUsers": 10                 // 可选，默认10
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "授权码创建成功",
  "license": {
    "license_key": "ADS-62A980E80A6ED001",
    "customer_name": "客户名称",
    "customer_email": "邮箱地址",
    "expire_date": "2025-12-31T23:59:59.000Z",
    "max_users": 10,
    "status": "active"
  }
}
```

### 2. 验证授权码

**接口**: `POST /api/validate-license`

**描述**: 验证授权码的有效性

**请求参数**:
```json
{
  "licenseKey": "ADS-62A980E80A6ED001"
}
```

**响应示例**:
```json
{
  "valid": true,
  "license": {
    "license_key": "ADS-62A980E80A6ED001",
    "customer_name": "客户名称",
    "customer_email": "邮箱地址",
    "expire_date": "2025-12-31T23:59:59.000Z",
    "max_users": 10,
    "status": "active",
    "features": {
      "ads_management": true,
      "user_management": true,
      "reports": true,
      "api_access": true
    }
  }
}
```

**验证失败响应**:
```json
{
  "valid": false,
  "reason": "授权码已过期"
}
```

### 3. 续费授权码

**接口**: `POST /api/renew-license`

**描述**: 续费或更新授权码

**请求参数**:
```json
{
  "licenseKey": "ADS-62A980E80A6ED001",
  "newExpireDate": "2026-12-31T23:59:59.000Z",  // 可选
  "newMaxUsers": 20                              // 可选
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "授权码续费成功",
  "license": {
    "license_key": "ADS-62A980E80A6ED001",
    "expire_date": "2026-12-31T23:59:59.000Z",
    "max_users": 20
  }
}
```

### 4. 管理授权码

**接口**: `POST /api/disable-license`

**描述**: 禁用、删除或恢复授权码

**请求参数**:
```json
{
  "license_key": "ADS-62A980E80A6ED001",
  "action": "disable"  // disable, delete, enable
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "授权码已成功禁用",
  "license": {
    "license_key": "ADS-62A980E80A6ED001",
    "customer_name": "客户名称",
    "status": "disabled",
    "disabled_at": "2025-01-20T15:30:00.000Z"
  }
}
```

### 5. 获取授权码列表

**接口**: `GET /api/list-licenses`

**描述**: 获取所有授权码列表

**响应示例**:
```json
{
  "success": true,
  "licenses": [
    {
      "id": 1,
      "license_key": "ADS-62A980E80A6ED001",
      "customer_name": "客户名称",
      "customer_email": "邮箱地址",
      "expire_date": "2025-12-31T23:59:59.000Z",
      "max_users": 10,
      "status": "active",
      "features": {
        "ads_management": true,
        "user_management": true,
        "reports": true,
        "api_access": true
      },
      "created_at": "2025-01-20T10:00:00.000Z",
      "renewed_at": null,
      "disabled_at": null,
      "is_expired": false
    }
  ],
  "total": 1,
  "active": 1,
  "disabled": 0,
  "deleted": 0,
  "expired": 0
}
```

### 6. 初始化数据库

**接口**: `POST /api/init-db`

**描述**: 初始化数据库和示例数据

**响应示例**:
```json
{
  "success": true,
  "message": "Supabase存储初始化完成",
  "license_key": "ADS-EXAMPLE123456789"
}
```

### 7. 查看真实数据库

**接口**: `GET /api/debug-db`

**描述**: 查看数据库中的原始数据（调试用）

**响应示例**:
```json
{
  "success": true,
  "message": "真实数据库数据查询成功",
  "stats": {
    "total": 3,
    "active": 2,
    "disabled": 0,
    "deleted": 1,
    "expired": 0
  },
  "raw_data": [...],
  "database_info": {
    "table_name": "licenses",
    "supabase_url": "https://xxx.supabase.co",
    "query_time": "2025-01-20T15:30:00.000Z"
  }
}
```

## 错误响应

所有接口在出错时都会返回以下格式的错误响应：

```json
{
  "success": false,
  "error": "错误描述",
  "message": "详细错误信息"
}
```

### 常见错误码

- `400` - 请求参数错误
- `404` - 授权码不存在
- `405` - 请求方法不允许
- `500` - 服务器内部错误

## 授权码格式

- **前缀**: `ADS-`
- **格式**: `ADS-` + 16位十六进制字符
- **示例**: `ADS-62A980E80A6ED001`

## 状态说明

| 状态 | 说明 | 验证结果 |
|------|------|----------|
| `active` | 激活状态 | 通过验证 |
| `disabled` | 已禁用 | 验证失败 |
| `deleted` | 已删除 | 验证失败 |
| `expired` | 已过期 | 验证失败 |

## 功能模块

每个授权码都包含以下功能模块：

```json
{
  "ads_management": true,    // 广告管理
  "user_management": true,   // 用户管理
  "reports": true,          // 报告功能
  "api_access": true        // API访问
}
```

## 使用示例

### JavaScript
```javascript
// 验证授权码
const validateLicense = async (licenseKey) => {
  const response = await fetch('/api/validate-license', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseKey })
  });
  
  const result = await response.json();
  return result.valid;
};

// 创建授权码
const createLicense = async (customerName, customerEmail, expireDays, maxUsers) => {
  const response = await fetch('/api/add-license', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName,
      customerEmail,
      expireDays,
      maxUsers
    })
  });
  
  return await response.json();
};
```

### Python
```python
import requests

def validate_license(license_key):
    url = 'https://your-domain.vercel.app/api/validate-license'
    data = {'licenseKey': license_key}
    
    response = requests.post(url, json=data)
    result = response.json()
    
    return result.get('valid', False)

def create_license(customer_name, customer_email=None, expire_days=365, max_users=10):
    url = 'https://your-domain.vercel.app/api/add-license'
    data = {
        'customerName': customer_name,
        'customerEmail': customer_email,
        'expireDays': expire_days,
        'maxUsers': max_users
    }
    
    response = requests.post(url, json=data)
    return response.json()
```

### cURL
```bash
# 验证授权码
curl -X POST https://your-domain.vercel.app/api/validate-license \
  -H "Content-Type: application/json" \
  -d '{"licenseKey": "ADS-62A980E80A6ED001"}'

# 创建授权码
curl -X POST https://your-domain.vercel.app/api/add-license \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "测试客户",
    "customerEmail": "test@example.com",
    "expireDays": 365,
    "maxUsers": 10
  }'
```

## 注意事项

1. **HTTPS**: 生产环境请使用HTTPS
2. **API限制**: 建议添加适当的API调用频率限制
3. **错误处理**: 客户端应妥善处理各种错误情况
4. **数据验证**: 服务端已进行基础验证，客户端也应进行相应验证
5. **安全性**: 敏感操作建议添加额外的身份验证机制
