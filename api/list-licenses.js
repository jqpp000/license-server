const { getAllLicenses } = require('./supabase-storage');

module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const allLicenses = await getAllLicenses();
    
    // 分别统计不同状态的授权码
    const activeLicenses = allLicenses.filter(license => 
      license.status === 'active' && !license.is_expired
    );
    const disabledLicenses = allLicenses.filter(license => 
      license.status === 'disabled'
    );
    const deletedLicenses = allLicenses.filter(license => 
      license.status === 'deleted'
    );
    const expiredLicenses = allLicenses.filter(license => 
      license.is_expired
    );
    
    res.json({ 
      success: true, 
      licenses: allLicenses,
      total: allLicenses.length,
      active: activeLicenses.length,
      disabled: disabledLicenses.length,
      deleted: deletedLicenses.length,
      expired: expiredLicenses.length
    });
    
  } catch (error) {
    console.error('❌ 获取授权码列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};