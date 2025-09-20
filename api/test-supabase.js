// 测试Supabase连接
const { createClient } = require('@supabase/supabase-js');

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
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: '环境变量未配置',
        message: 'SUPABASE_URL 或 SUPABASE_ANON_KEY 未配置'
      });
    }

    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 测试连接 - 尝试查询licenses表
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .limit(1);
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Supabase连接失败',
        message: error.message,
        error_code: error.code,
        details: error.details
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Supabase连接成功',
      data: data || [],
      table_exists: true
    });
    
  } catch (error) {
    console.error('❌ Supabase测试失败:', error);
    res.status(500).json({
      success: false,
      error: 'Supabase测试失败',
      message: error.message
    });
  }
};
