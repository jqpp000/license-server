// Supabase数据库存储系统 - 真正的持久化存储
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 表名
const TABLE_NAME = 'licenses';

// 初始化存储 - 创建表结构
async function initializeStorage() {
  try {
    console.log('🔄 初始化Supabase数据库...');
    console.log('ℹ️ Supabase URL:', process.env.SUPABASE_URL ? '已配置' : '未配置');
    console.log('ℹ️ Supabase Key:', process.env.SUPABASE_ANON_KEY ? '已配置' : '未配置');
    
    // 检查表是否存在，如果不存在则创建
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      // 表不存在，需要创建
      console.log('📋 licenses表不存在，需要手动创建');
      console.log('⚠️  请在Supabase控制台手动创建licenses表');
      
      // 即使表不存在，我们也返回true，因为用户需要手动创建表
      console.log('✅ Supabase数据库初始化完成（表需要手动创建）');
      return true;
    }
    
    if (error) {
      console.error('❌ 查询数据库失败:', error);
      throw new Error(`查询数据库失败: ${error.message}`);
    }
    
    console.log('✅ licenses表已存在');
    
    // 检查是否有示例数据
    const { data: existingData, error: selectError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('license_key', 'ADS-EXAMPLE123456789');
    
    if (selectError) {
      console.error('❌ 查询示例数据失败:', selectError);
      throw new Error(`查询示例数据失败: ${selectError.message}`);
    }
    
    // 如果没有示例数据，则插入
    if (!existingData || existingData.length === 0) {
      console.log('📝 插入示例数据...');
      const { error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert([
          {
            license_key: 'ADS-EXAMPLE123456789',
            customer_name: '示例客户',
            customer_email: 'example@example.com',
            expire_date: '2026-12-31T23:59:59.000Z',
            max_users: 10,
            status: 'active',
            features: {
              ads_management: true,
              user_management: true,
              reports: true,
              api_access: true
            }
          }
        ]);
      
      if (insertError) {
        console.error('❌ 插入示例数据失败:', insertError);
        throw new Error(`插入示例数据失败: ${insertError.message}`);
      }
      
      console.log('✅ 示例数据插入成功');
    } else {
      console.log('✅ 示例数据已存在');
    }
    
    console.log('✅ Supabase数据库初始化完成');
    return true;
  } catch (error) {
    console.error('❌ Supabase初始化失败:', error);
    throw new Error(`Supabase初始化失败: ${error.message}`);
  }
}

// 获取所有授权码
async function getAllLicenses() {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ 获取授权码列表失败:', error);
      return [];
    }
    
    return (data || []).map(license => ({
      ...license,
      is_expired: new Date() > new Date(license.expire_date)
    }));
  } catch (error) {
    console.error('❌ 获取授权码列表失败:', error);
    return [];
  }
}

// 根据授权码查找
async function findLicenseByKey(licenseKey) {
  try {
    console.log('🔍 在Supabase中查找授权码:', licenseKey);
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('license_key', licenseKey)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ 查找结果: 未找到');
        return null;
      }
      console.error('❌ 查找授权码失败:', error);
      return null;
    }
    
    console.log('✅ 查找结果: 找到');
    return data;
  } catch (error) {
    console.error('❌ 查找授权码失败:', error);
    return null;
  }
}

// 添加新授权码
async function addLicense(licenseData) {
  try {
    console.log('➕ 添加新授权码到Supabase:', licenseData.license_key);
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([licenseData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ 添加授权码失败:', error);
      throw error;
    }
    
    console.log('✅ 授权码添加成功:', data.license_key);
    return data;
  } catch (error) {
    console.error('❌ 添加授权码失败:', error);
    throw error;
  }
}

// 更新授权码
async function updateLicense(licenseKey, updateData) {
  try {
    console.log('🔄 在Supabase中更新授权码:', licenseKey);
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        ...updateData,
        renewed_at: new Date().toISOString()
      })
      .eq('license_key', licenseKey)
      .select()
      .single();
    
    if (error) {
      console.error('❌ 更新授权码失败:', error);
      return null;
    }
    
    console.log('✅ 授权码更新成功');
    return data;
  } catch (error) {
    console.error('❌ 更新授权码失败:', error);
    throw error;
  }
}

module.exports = {
  initializeStorage,
  getAllLicenses,
  findLicenseByKey,
  addLicense,
  updateLicense
};
