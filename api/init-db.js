const { initializeStorage } = require('./simple-storage');

module.exports = async function handler(req, res) {
  try {
    // 初始化简化存储
    const success = initializeStorage();
    
    if (success) {
      console.log('✅ 简化存储初始化完成');
      console.log('🔑 示例授权码: ADS-EXAMPLE123456789');

      res.status(200).json({ 
        success: true, 
        message: '简化存储初始化完成',
        license_key: 'ADS-EXAMPLE123456789'
      });
    } else {
      throw new Error('存储初始化失败');
    }

  } catch (error) {
    console.error('❌ 简化存储初始化失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '简化存储初始化失败',
      message: error.message
    });
  }
};

