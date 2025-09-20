const { getAllLicenses } = require('./simple-storage');

module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const licenses = getAllLicenses();
    
    res.json({
      success: true,
      message: '简化存储调试信息',
      data: {
        totalLicenses: licenses.length,
        licenses: licenses.map(l => ({
          id: l.id,
          license_key: l.license_key,
          customer_name: l.customer_name,
          status: l.status,
          expire_date: l.expire_date,
          is_expired: l.is_expired
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ 简化存储调试API错误:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
