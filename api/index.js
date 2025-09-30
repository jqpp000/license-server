// Vercel无服务器函数 - 主入口
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const AuthHandler = require('./auth/auth-handler');
const AuthMiddleware = require('./auth/auth-middleware');

// Supabase配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

console.log('🔧 Supabase配置检查:');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_ANON_KEY:', supabaseKey ? '已设置' : '未设置');

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();

// 初始化认证系统
const authHandler = new AuthHandler();
const authMiddleware = new AuthMiddleware();

// 基础中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 安全中间件
app.use(authMiddleware.securityHeaders());
app.use(authMiddleware.corsHandler());
app.use(authMiddleware.requestLogger());

// 静态文件服务
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Supabase数据操作函数
const TABLE_NAME = 'licenses';

// 获取所有授权码
async function getAllLicenses() {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ 获取授权码列表失败:', error);
      return [];
    }
    
    return (data || []).map(license => ({
      ...license,
      is_expired: new Date() > new Date(license.expire_date)
    }));
  } catch (error) {
    console.error('❌ 获取授权码列表失败:', error);
    return [];
  }
}

// 根据授权码查找
async function findLicenseByKey(licenseKey) {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('license_key', licenseKey)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('❌ 查找授权码失败:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('❌ 查找授权码失败:', error);
    return null;
  }
}

// 添加新授权码
async function addLicense(licenseData) {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([licenseData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ 添加授权码失败:', error);
      throw error;
    }
    
    console.log('✅ 授权码添加成功:', data.license_key);
    return data;
  } catch (error) {
    console.error('❌ 添加授权码失败:', error);
    throw error;
  }
}

// 更新授权码
async function updateLicense(licenseKey, updateData) {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        ...updateData,
        renewed_at: new Date().toISOString()
      })
      .eq('license_key', licenseKey)
      .select()
      .single();
    
    if (error) {
      console.error('❌ 更新授权码失败:', error);
      return null;
    }
    
    console.log('✅ 授权码更新成功:', data);
    return data;
  } catch (error) {
    console.error('❌ 更新授权码失败:', error);
    throw error;
  }
}

// 生成授权码
function generateLicenseKey() {
  const crypto = require('crypto');
  // 生成更复杂的授权码：ADS- + 20位随机字符（数字+字母）
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ADS-';
  
  // 生成20位随机字符
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// ===== 认证相关路由 =====

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
  res.json({
    success: true,
    message: '登出成功'
  });
});

// ===== 授权管理相关路由 =====

// 初始化数据库
app.post('/api/init-db', async (req, res) => {
  try {
    // 检查是否有示例数据
    const { data: existingData, error: selectError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('license_key', 'ADS-EXAMPLE123456789');
    
    if (selectError) {
      console.error('❌ 查询示例数据失败:', selectError);
      throw new Error(`查询示例数据失败: ${selectError.message}`);
    }
    
    // 如果没有示例数据，则插入
    if (!existingData || existingData.length === 0) {
      console.log('📝 插入示例数据...');
      const { error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert([
          {
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
            }
          }
        ]);
      
      if (insertError) {
        console.error('❌ 插入示例数据失败:', insertError);
        throw new Error(`插入示例数据失败: ${insertError.message}`);
      }
      
      console.log('✅ 示例数据插入成功');
    } else {
      console.log('✅ 示例数据已存在');
    }
    
    const data = await getAllLicenses();
    console.log('✅ Supabase数据库初始化完成');
    console.log('🔑 示例授权码: ADS-EXAMPLE123456789');
    
    res.json({
      success: true,
      message: 'Supabase数据库初始化完成',
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
app.get('/api/list-licenses',
  authMiddleware.authenticateToken(),
  authMiddleware.requirePermission('read'),
  async (req, res) => {
  try {
    const licenses = await getAllLicenses();
    
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
app.post('/api/add-license',
  authMiddleware.authenticateToken(),
  authMiddleware.requirePermission('write'),
  authMiddleware.apiRateLimit(),
  async (req, res) => {
  try {
    console.log('🔧 添加授权码请求:', req.body);
    const { customerName, customerEmail, expireDays, maxUsers } = req.body;
    
    if (!customerName) {
      console.log('❌ 缺少客户名称');
      return res.status(400).json({ error: '缺少客户名称' });
    }
    
    const licenseKey = generateLicenseKey();
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + (expireDays || 365));
    
    const newLicense = {
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
      }
    };
    
    const result = await addLicense(newLicense);
    
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

// 验证授权码（公开接口）
app.post('/api/validate-license',
  authMiddleware.rateLimit({ maxRequests: 200, windowMs: 60 * 1000 }),
  async (req, res) => {
  try {
    const { licenseKey } = req.body;
    
    if (!licenseKey) {
      return res.status(400).json({ error: '缺少授权码' });
    }
    
    const license = await findLicenseByKey(licenseKey);
    
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
app.post('/api/renew-license',
  authMiddleware.authenticateToken(),
  authMiddleware.requirePermission('write'),
  async (req, res) => {
  try {
    const { licenseKey, newExpireDate, newMaxUsers } = req.body;
    
    console.log('🔧 续费请求参数:', { licenseKey, newExpireDate, newMaxUsers });
    
    if (!licenseKey || !newExpireDate) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const updateData = {
      expire_date: newExpireDate,
      max_users: newMaxUsers,
      status: 'active'
    };
    
    console.log('🔧 更新数据:', updateData);
    
    const result = await updateLicense(licenseKey, updateData);
    
    console.log('🔧 更新结果:', result);
    
    if (!result) {
      return res.status(404).json({ error: '授权码不存在' });
    }
    
    res.json({
      success: true,
      message: '授权码续费成功',
      license: result
    });
  } catch (error) {
    console.error('❌ 续费授权码失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除授权码
app.delete('/api/delete-license',
  authMiddleware.authenticateToken(),
  authMiddleware.requirePermission('write'),
  async (req, res) => {
  try {
    const { licenseKey } = req.body;
    
    console.log('🔧 删除请求参数:', { licenseKey });
    
    if (!licenseKey) {
      return res.status(400).json({ error: '缺少授权码参数' });
    }
    
    // 检查授权码是否存在
    const existingLicense = await findLicenseByKey(licenseKey);
    if (!existingLicense) {
      return res.status(404).json({ error: '授权码不存在' });
    }
    
    // 删除授权码
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('license_key', licenseKey);
    
    if (error) {
      console.error('❌ 删除授权码失败:', error);
      return res.status(500).json({ error: '删除失败' });
    }
    
    console.log('✅ 授权码删除成功:', licenseKey);
    
    res.json({
      success: true,
      message: '授权码删除成功',
      licenseKey: licenseKey
    });
  } catch (error) {
    console.error('❌ 删除授权码失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ===== 页面路由 =====

// 登录页面
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// 主页路由（重定向到登录）
app.get('/', (req, res) => {
  res.redirect('/login');
});

// 管理界面
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin-dashboard.html'));
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

// 测试 Supabase 连接
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('🔧 测试 Supabase 连接...');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY 长度:', process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : '未设置');
    
    // 先测试基本连接
    const { data: testData, error: testError } = await supabase
      .from('licenses')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase 查询失败:', testError);
      
      // 检查是否是 RLS 问题
      if (testError.message.includes('RLS') || testError.message.includes('row level security')) {
        return res.status(500).json({ 
          error: 'RLS 权限问题', 
          details: '需要启用 Row Level Security 或创建访问策略',
          suggestion: '请在 Supabase 控制台中启用 RLS 并创建策略',
          error_code: testError.code,
          full_error: testError.message
        });
      }
      
      // 检查是否是表不存在的问题
      if (testError.code === 'PGRST116' || testError.message.includes('relation "licenses" does not exist')) {
        return res.status(500).json({ 
          error: '数据库表不存在', 
          details: 'licenses 表未创建，请先在 Supabase 中创建表',
          suggestion: '请访问 Supabase 控制台创建 licenses 表'
        });
      }
      
      return res.status(500).json({ 
        error: '数据库连接失败', 
        details: testError.message,
        code: testError.code
      });
    }
    
    console.log('✅ Supabase 连接成功');
    res.json({ 
      success: true, 
      message: '数据库连接正常',
      data: testData,
      count: testData ? testData.length : 0
    });
  } catch (error) {
    console.error('❌ 测试数据库连接失败:', error);
    res.status(500).json({ 
      error: '数据库连接测试失败', 
      details: error.message 
    });
  }
});

// 导出Express应用
module.exports = app;
