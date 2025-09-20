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
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { licenseKey, newExpireDate, newMaxUsers } = req.body;
  
  if (!licenseKey || !newExpireDate) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  const db = await getDatabase();
  
  try {
    // 检查授权码是否存在
    const existingLicense = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM licenses WHERE license_key = ?',
        [licenseKey],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!existingLicense) {
      return res.status(404).json({ error: '授权码不存在' });
    }
    
    // 更新授权码
    const result = await new Promise((resolve, reject) => {
      db.run(
        'UPDATE licenses SET expire_date = ?, max_users = ?, status = "active", renewed_at = ? WHERE license_key = ?',
        [newExpireDate, newMaxUsers || existingLicense.max_users, new Date().toISOString(), licenseKey],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
    
    if (result.changes === 0) {
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
    console.error('数据库错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  } finally {
    db.close();
  }
};