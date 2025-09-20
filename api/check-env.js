// 检查环境变量配置
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
    
    res.status(200).json({
      success: true,
      environment: {
        SUPABASE_URL: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : '未配置',
        SUPABASE_ANON_KEY: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : '未配置',
        NODE_ENV: process.env.NODE_ENV || 'development'
      },
      message: '环境变量检查完成'
    });
  } catch (error) {
    console.error('❌ 环境变量检查失败:', error);
    res.status(500).json({
      success: false,
      error: '环境变量检查失败',
      message: error.message
    });
  }
};
