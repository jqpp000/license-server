const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
function getDatabase() {
  const dbPath = path.join(process.cwd(), 'data', 'licenses.db');
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
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { licenseKey } = req.body;
  
  if (!licenseKey) {
    return res.status(400).json({ error: '缺少授权码' });
  }
  
  const db = getDatabase();
  
  try {
    // 查询授权码
    const license = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM licenses WHERE license_key = ? AND status = "active"',
        [licenseKey],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!license) {
      return res.json({ 
        valid: false, 
        reason: '授权码不存在或已被禁用' 
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
    console.error('数据库错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  } finally {
    db.close();
  }
};