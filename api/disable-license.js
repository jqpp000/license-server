// 禁用/删除授权码API
const { findLicenseByKey, updateLicense } = require('./supabase-storage');
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

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

  try {
    const { license_key, action } = req.body;

    if (!license_key) {
      return res.status(400).json({
        success: false,
        error: '授权码不能为空'
      });
    }

    if (!action || !['disable', 'delete', 'enable'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: '操作类型无效，支持的操作：disable（禁用）、delete（删除）或 enable（恢复）'
      });
    }

    console.log(`🔄 开始${action === 'disable' ? '禁用' : action === 'delete' ? '删除' : '恢复'}授权码:`, license_key);

    // 查找授权码
    const existingLicense = await findLicenseByKey(license_key);

    if (!existingLicense) {
      return res.status(404).json({
        success: false,
        error: '授权码不存在'
      });
    }

    if (action === 'disable') {
      // 禁用授权码 - 可以恢复
      const updatedLicense = await updateLicense(license_key, {
        status: 'disabled',
        disabled_at: new Date().toISOString()
      });

      if (updatedLicense) {
        console.log('✅ 授权码禁用成功:', license_key);
        res.status(200).json({
          success: true,
          message: '授权码已成功禁用（可恢复）',
          license: {
            license_key: updatedLicense.license_key,
            customer_name: updatedLicense.customer_name,
            status: updatedLicense.status,
            disabled_at: updatedLicense.disabled_at
          }
        });
      } else {
        throw new Error('禁用授权码失败');
      }
    } else if (action === 'delete') {
      // 删除授权码 - 永久删除，不可恢复
      const { data, error } = await supabase
        .from('licenses')
        .delete()
        .eq('license_key', license_key)
        .select();

      if (error) {
        console.error('❌ 删除授权码失败:', error);
        throw new Error('删除授权码失败');
      }

      if (data && data.length > 0) {
        console.log('✅ 授权码永久删除成功:', license_key);
        res.status(200).json({
          success: true,
          message: '授权码已永久删除（不可恢复）',
          license: {
            license_key: data[0].license_key,
            customer_name: data[0].customer_name,
            status: 'deleted'
          }
        });
      } else {
        throw new Error('授权码不存在');
      }
    } else if (action === 'enable') {
      // 恢复授权码 - 将状态改回active
      const updatedLicense = await updateLicense(license_key, {
        status: 'active',
        disabled_at: null
      });

      if (updatedLicense) {
        console.log('✅ 授权码恢复成功:', license_key);
        res.status(200).json({
          success: true,
          message: '授权码已成功恢复',
          license: {
            license_key: updatedLicense.license_key,
            customer_name: updatedLicense.customer_name,
            status: updatedLicense.status
          }
        });
      } else {
        throw new Error('恢复授权码失败');
      }
    }

  } catch (error) {
    console.error('❌ 操作授权码失败:', error);
    res.status(500).json({
      success: false,
      error: '操作授权码失败',
      message: error.message
    });
  }
};
