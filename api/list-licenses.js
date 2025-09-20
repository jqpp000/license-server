const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接并初始化
async function getDatabase() {
  const dbPath = path.join('/tmp', 'licenses.db');
  const db = new sqlite3.Database(dbPath);
  
  // 确保数据库表存在
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      // 创建授权码表
      db.run(`
        CREATE TABLE IF NOT EXISTS licenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          license_key TEXT UNIQUE NOT NULL,
          customer_name TEXT NOT NULL,
          customer_email TEXT,
          expire_date TEXT NOT NULL,
          max_users INTEGER DEFAULT 10,
          status TEXT DEFAULT 'active',
          features TEXT DEFAULT '{}',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          renewed_at TEXT,
          disabled_at TEXT
        )
      `);
      
      // 插入示例数据（如果不存在）
      db.run(`
        INSERT OR IGNORE INTO licenses 
        (license_key, customer_name, customer_email, expire_date, max_users, status, features)
        VALUES 
        ('ADS-EXAMPLE123456789', '示例客户', 'example@example.com', '2026-12-31T23:59:59.000Z', 10, 'active', '{"ads_management": true, "user_management": true, "reports": true, "api_access": true}')
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
  
  return db;
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
  
  const db = await getDatabase();
  
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