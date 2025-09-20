const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

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
  
  const db = await getDatabase();
  
  try {
    // 生成授权码
    const licenseKey = generateLicenseKey();
    
    // 计算过期时间
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + (expireDays || 365));
    
    // 插入新授权码
    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO licenses (license_key, customer_name, customer_email, expire_date, max_users, status, features, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          licenseKey,
          customerName,
          customerEmail || '',
          expireDate.toISOString(),
          maxUsers || 10,
          'active',
          JSON.stringify({
            ads_management: true,
            user_management: true,
            reports: true,
            api_access: true
          }),
          new Date().toISOString()
        ],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
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
    console.error('数据库错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  } finally {
    db.close();
  }
};
