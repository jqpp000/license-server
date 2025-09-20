// 调试API - 查看真实数据库数据
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);
const TABLE_NAME = 'licenses';

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
    console.log('🔍 查询真实数据库数据...');
    
    // 查询所有原始数据
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ 查询数据库失败:', error);
      return res.status(500).json({
        success: false,
        error: '查询数据库失败',
        details: error.message
      });
    }
    
    // 统计各状态数量
    const stats = {
      total: data.length,
      active: data.filter(license => license.status === 'active').length,
      disabled: data.filter(license => license.status === 'disabled').length,
      deleted: data.filter(license => license.status === 'deleted').length,
      expired: data.filter(license => new Date() > new Date(license.expire_date)).length
    };
    
    console.log('✅ 数据库查询成功，找到', data.length, '条记录');
    
    res.json({
      success: true,
      message: '真实数据库数据查询成功',
      stats: stats,
      raw_data: data,
      database_info: {
        table_name: TABLE_NAME,
        supabase_url: supabaseUrl,
        query_time: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ 调试查询失败:', error);
    res.status(500).json({
      success: false,
      error: '调试查询失败',
      message: error.message
    });
  }
};
