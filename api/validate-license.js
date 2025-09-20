const { findLicenseByKey } = require('./simple-storage');

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
  
  const { licenseKey } = req.body;
  
  if (!licenseKey) {
    return res.status(400).json({ error: '缺少授权码' });
  }
  
  try {
    // 查找授权码
    const license = findLicenseByKey(licenseKey);
    
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
    
    // 检查是否过期
    if (new Date() > new Date(license.expire_date)) {
      return res.json({ 
        valid: false, 
        reason: '授权码已过期' 
      });
    }
    
    // 返回授权信息
    res.json({ 
      valid: true, 
      license: {
        license_key: license.license_key,
        customer_name: license.customer_name,
        customer_email: license.customer_email,
        expire_date: license.expire_date,
        max_users: license.max_users,
        status: license.status,
        features: JSON.parse(license.features || '{}')
      }
    });
    
  } catch (error) {
    console.error('验证授权码错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};