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
    const licenses = await getAllLicenses();
    
    res.json({ 
      success: true, 
      licenses: licenses,
      total: licenses.length
    });
    
  } catch (error) {
    console.error('❌ 获取授权码列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};