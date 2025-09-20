const { findLicenseByKey, updateLicense } = require('./kv-storage');

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
  
  const { licenseKey, newExpireDate, newMaxUsers } = req.body;
  
  if (!licenseKey || !newExpireDate) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  try {
    // 检查授权码是否存在
    const existingLicense = await findLicenseByKey(licenseKey);
    
    if (!existingLicense) {
      return res.status(404).json({ error: '授权码不存在' });
    }
    
    // 更新授权码
    const updatedLicense = await updateLicense(licenseKey, {
      expire_date: newExpireDate,
      max_users: newMaxUsers || existingLicense.max_users,
      status: 'active'
    });
    
    if (!updatedLicense) {
      return res.status(500).json({ error: '更新失败' });
    }
    
    res.json({ 
      success: true, 
      message: '授权码续费成功',
      license: {
        license_key: licenseKey,
        expire_date: newExpireDate,
        max_users: newMaxUsers || existingLicense.max_users
      }
    });
    
  } catch (error) {
    console.error('续费授权码错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};