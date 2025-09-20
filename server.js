// 传统服务器版本 - 适合VPS/ECS部署
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.static('public'));

// CORS中间件
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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

// API路由

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

// 获取所有授权码
app.get('/api/list-licenses', (req, res) => {
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

// 添加新授权码
app.post('/api/add-license', (req, res) => {
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

// 验证授权码
app.post('/api/validate-license', (req, res) => {
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

// 续费授权码
app.post('/api/renew-license', (req, res) => {
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

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 友好管理界面
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-friendly.html'));
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
