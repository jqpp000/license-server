const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 创建数据目录
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库
const dbPath = path.join(dataDir, 'licenses.db');
const db = new sqlite3.Database(dbPath);

// 创建表
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
  
  // 插入示例数据
  db.run(`
    INSERT OR IGNORE INTO licenses 
    (license_key, customer_name, customer_email, expire_date, max_users, status, features)
    VALUES 
    ('ADS-EXAMPLE123456789', '示例客户', 'example@example.com', '2026-12-31T23:59:59.000Z', 10, 'active', '{"ads_management": true, "user_management": true, "reports": true, "api_access": true}')
  `);
  
  console.log('✅ 数据库初始化完成');
  console.log('📁 数据库文件位置:', dbPath);
  console.log('🔑 示例授权码: ADS-EXAMPLE123456789');
});

db.close();

export default async function handler(req, res) {
  res.status(200).json({ 
    success: true, 
    message: '数据库初始化完成',
    license_key: 'ADS-EXAMPLE123456789'
  });
}

