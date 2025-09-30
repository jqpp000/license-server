// 增强安全版授权服务器 - 集成认证系统
const express = require('express');
const path = require('path');
const fs = require('fs');
const AuthHandler = require('./auth/auth-handler');
const AuthMiddleware = require('./auth/auth-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// 初始化认证系统
const authHandler = new AuthHandler();
const authMiddleware = new AuthMiddleware();

// 启动清理调度
authMiddleware.startCleanupSchedule();

// 基础中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 安全中间件
app.use(authMiddleware.securityHeaders());
app.use(authMiddleware.corsHandler());
app.use(authMiddleware.requestLogger());

// 静态文件服务（无需认证）
app.use('/public', express.static('public'));

// 数据存储文件路径
const DATA_FILE = './data/licenses.json';

// 确保数据目录存在
function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 获取初始数据
function getInitialData() {
  return [
    {
      id: 1,
      license_key: 'ADS-EXAMPLE123456789',
      customer_name: '示例客户',
      customer_email: 'example@example.com',
      expire_date: '2026-12-31T23:59:59.000Z',
      max_users: 10,
      status: 'active',
      features: {
        ads_management: true,
        user_management: true,
        reports: true,
        api_access: true
      },
      created_at: new Date().toISOString(),
      renewed_at: null,
      disabled_at: null
    }
  ];
}

// 读取数据
function readData() {
  try {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) {
      const initialData = getInitialData();
      writeData(initialData);
      return initialData;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取数据失败:', error);
    return getInitialData();
  }
}

// 写入数据
function writeData(data) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('✅ 数据已保存，当前授权码数量:', data.length);
  } catch (error) {
    console.error('写入数据失败:', error);
    throw error;
  }
}

// 生成授权码
function generateLicenseKey() {
  const crypto = require('crypto');
  return 'ADS-' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

// ===== 认证相关路由（无需认证） =====

// 登录接口
app.post('/api/auth/login', authMiddleware.loginRateLimit(), async (req, res) => {
  try {
    const { username, password, totpCode } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: '用户名和密码不能为空',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const result = await authHandler.authenticate(username, password, totpCode);

    res.json({
      success: true,
      message: '登录成功',
      token: result.token,
      user: result.user
    });

  } catch (error) {
    res.status(401).json({
      error: error.message,
      code: 'LOGIN_FAILED'
    });
  }
});

// 验证令牌接口
app.get('/api/auth/verify', authMiddleware.authenticateToken(), (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// 登出接口
app.post('/api/auth/logout', authMiddleware.authenticateToken(), (req, res) => {
  // 在实际应用中，可以在这里将token加入黑名单
  res.json({
    success: true,
    message: '登出成功'
  });
});

// ===== 授权管理相关路由（需要认证） =====

// 初始化数据库
app.post('/api/init-db', (req, res) => {
  try {
    const data = readData();
    console.log('✅ 数据库初始化完成');
    console.log('🔑 示例授权码: ADS-EXAMPLE123456789');
    
    res.json({
      success: true,
      message: '数据库初始化完成',
      license_key: 'ADS-EXAMPLE123456789',
      total: data.length
    });
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    res.status(500).json({
      success: false,
      error: '数据库初始化失败',
      message: error.message
    });
  }
});

// 获取所有授权码（需要读取权限）
app.get('/api/list-licenses',
  authMiddleware.authenticateToken(),
  authMiddleware.requirePermission('read'),
  (req, res) => {
  try {
    const licenses = readData().map(license => ({
      ...license,
      is_expired: new Date() > new Date(license.expire_date)
    }));
    
    res.json({
      success: true,
      licenses: licenses,
      total: licenses.length
    });
  } catch (error) {
    console.error('❌ 获取授权码列表失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 添加新授权码（需要写入权限）
app.post('/api/add-license',
  authMiddleware.authenticateToken(),
  authMiddleware.requirePermission('write'),
  authMiddleware.apiRateLimit(),
  (req, res) => {
  try {
    const { customerName, customerEmail, expireDays, maxUsers } = req.body;
    
    if (!customerName) {
      return res.status(400).json({ error: '缺少客户名称' });
    }
    
    const licenses = readData();
    const licenseKey = generateLicenseKey();
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + (expireDays || 365));
    
    const newId = licenses.length > 0 ? Math.max(...licenses.map(l => l.id)) + 1 : 1;
    const newLicense = {
      id: newId,
      license_key: licenseKey,
      customer_name: customerName,
      customer_email: customerEmail || '',
      expire_date: expireDate.toISOString(),
      max_users: maxUsers || 10,
      status: 'active',
      features: {
        ads_management: true,
        user_management: true,
        reports: true,
        api_access: true
      },
      created_at: new Date().toISOString(),
      renewed_at: null,
      disabled_at: null
    };
    
    licenses.push(newLicense);
    writeData(licenses);
    
    console.log('✅ 授权码添加成功:', newLicense.license_key);
    
    res.json({
      success: true,
      message: '授权码创建成功',
      license: {
        license_key: licenseKey,
        customer_name: customerName,
        customer_email: customerEmail,
        expire_date: expireDate.toISOString(),
        max_users: maxUsers || 10,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('❌ 创建授权码失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 验证授权码（公开接口，但有频率限制）
app.post('/api/validate-license',
  authMiddleware.rateLimit({ maxRequests: 200, windowMs: 60 * 1000 }),
  (req, res) => {
  try {
    const { licenseKey } = req.body;
    
    if (!licenseKey) {
      return res.status(400).json({ error: '缺少授权码' });
    }
    
    const licenses = readData();
    const license = licenses.find(l => l.license_key === licenseKey);
    
    if (!license) {
      return res.json({
        valid: false,
        reason: '授权码不存在或已被禁用'
      });
    }
    
    if (license.status !== 'active') {
      return res.json({
        valid: false,
        reason: '授权码已被禁用'
      });
    }
    
    if (new Date() > new Date(license.expire_date)) {
      return res.json({
        valid: false,
        reason: '授权码已过期'
      });
    }
    
    res.json({
      valid: true,
      license: {
        license_key: license.license_key,
        customer_name: license.customer_name,
        customer_email: license.customer_email,
        expire_date: license.expire_date,
        max_users: license.max_users,
        status: license.status,
        features: license.features
      }
    });
  } catch (error) {
    console.error('❌ 验证授权码失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 续费授权码（需要写入权限）
app.post('/api/renew-license',
  authMiddleware.authenticateToken(),
  authMiddleware.requirePermission('write'),
  (req, res) => {
  try {
    const { licenseKey, newExpireDate, newMaxUsers } = req.body;
    
    if (!licenseKey || !newExpireDate) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const licenses = readData();
    const licenseIndex = licenses.findIndex(l => l.license_key === licenseKey);
    
    if (licenseIndex === -1) {
      return res.status(404).json({ error: '授权码不存在' });
    }
    
    licenses[licenseIndex] = {
      ...licenses[licenseIndex],
      expire_date: newExpireDate,
      max_users: newMaxUsers || licenses[licenseIndex].max_users,
      status: 'active',
      renewed_at: new Date().toISOString()
    };
    
    writeData(licenses);
    
    console.log('✅ 授权码续费成功:', licenseKey);
    
    res.json({
      success: true,
      message: '授权码续费成功',
      license: licenses[licenseIndex]
    });
  } catch (error) {
    console.error('❌ 续费授权码失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ===== 用户管理路由（需要管理员权限） =====

// 修改密码
app.post('/api/user/change-password',
  authMiddleware.authenticateToken(),
  async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          error: '旧密码和新密码不能为空',
          code: 'MISSING_PASSWORDS'
        });
      }

      const result = await authHandler.changePassword(req.user.userId, oldPassword, newPassword);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      res.status(400).json({
        error: error.message,
        code: 'PASSWORD_CHANGE_FAILED'
      });
    }
  }
);

// 设置双因子认证
app.post('/api/user/setup-2fa',
  authMiddleware.authenticateToken(),
  async (req, res) => {
    try {
      const result = await authHandler.setupTwoFactor(req.user.userId);

      res.json({
        success: true,
        qrCodeUrl: result.qrCodeUrl,
        secret: result.secret,
        manualEntryKey: result.manualEntryKey
      });

    } catch (error) {
      res.status(500).json({
        error: error.message,
        code: 'SETUP_2FA_FAILED'
      });
    }
  }
);

// 启用双因子认证
app.post('/api/user/enable-2fa',
  authMiddleware.authenticateToken(),
  async (req, res) => {
    try {
      const { verificationCode } = req.body;

      if (!verificationCode) {
        return res.status(400).json({
          error: '验证码不能为空',
          code: 'MISSING_VERIFICATION_CODE'
        });
      }

      const result = await authHandler.enableTwoFactor(req.user.userId, verificationCode);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      res.status(400).json({
        error: error.message,
        code: 'ENABLE_2FA_FAILED'
      });
    }
  }
);

// 获取认证日志（管理员权限）
app.get('/api/admin/auth-logs',
  authMiddleware.authenticateToken(),
  authMiddleware.requireRole('admin'),
  (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const logs = authHandler.getAuthLogs(limit);

      res.json({
        success: true,
        logs,
        total: logs.length
      });

    } catch (error) {
      res.status(500).json({
        error: '获取日志失败',
        code: 'GET_LOGS_FAILED'
      });
    }
  }
);

// ===== 页面路由 =====

// 登录页面
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 主页路由（重定向到登录）
app.get('/', (req, res) => {
  res.redirect('/login');
});

// 管理界面（需要认证）
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// 旧版管理界面（向后兼容）
app.get('/admin-old', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-friendly.html'));
});

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: {
      authentication: true,
      twoFactor: true,
      rateLimit: true,
      auditLog: true
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 授权系统服务器已启动`);
  console.log(`📡 端口: ${PORT}`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
  console.log(`🔧 管理界面: http://localhost:${PORT}/admin`);
  console.log(`🔑 示例授权码: ADS-EXAMPLE123456789`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('📴 服务器正在关闭...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 服务器正在关闭...');
  process.exit(0);
});
