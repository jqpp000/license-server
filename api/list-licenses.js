const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
function getDatabase() {
  const dbPath = path.join('/tmp', 'licenses.db');
  return new sqlite3.Database(dbPath);
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
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const db = getDatabase();
  
  try {
    // 查询所有授权码
    const licenses = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM licenses ORDER BY created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    // 格式化数据
    const formattedLicenses = licenses.map(license => ({
      license_key: license.license_key,
      customer_name: license.customer_name,
      customer_email: license.customer_email,
      expire_date: license.expire_date,
      max_users: license.max_users,
      status: license.status,
      created_at: license.created_at,
      renewed_at: license.renewed_at,
      features: JSON.parse(license.features || '{}'),
      is_expired: new Date() > new Date(license.expire_date)
    }));
    
    res.json({ 
      success: true, 
      licenses: formattedLicenses,
      total: formattedLicenses.length
    });
    
  } catch (error) {
    console.error('数据库错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  } finally {
    db.close();
  }
};