const { initializeStorage } = require('./kv-storage');

module.exports = async function handler(req, res) {
  try {
    // 初始化KV数据库
    await initializeStorage();
    
    console.log('✅ KV数据库初始化完成');
    console.log('🔑 示例授权码: ADS-EXAMPLE123456789');

    res.status(200).json({ 
      success: true, 
      message: 'KV数据库初始化完成',
      license_key: 'ADS-EXAMPLE123456789'
    });

  } catch (error) {
    console.error('❌ KV数据库初始化失败:', error);
    res.status(500).json({ 
      success: false, 
      error: 'KV数据库初始化失败',
      message: error.message
    });
  }
};

