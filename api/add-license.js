const crypto = require('crypto');
const { addLicense } = require('./kv-storage');

// 生成授权码
function generateLicenseKey() {
  return 'ADS-' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { customerName, customerEmail, expireDays, maxUsers } = req.body;
  
  if (!customerName) {
    return res.status(400).json({ error: '缺少客户名称' });
  }
  
  try {
    // 生成授权码
    const licenseKey = generateLicenseKey();
    
    // 计算过期时间
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + (expireDays || 365));
    
    // 添加新授权码
    const newLicense = await addLicense({
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
    });
    
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
    console.error('创建授权码错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};
