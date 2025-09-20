// 禁用/删除授权码API
const { findLicenseByKey, updateLicense } = require('./supabase-storage');

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

    if (!action || !['disable', 'delete'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: '操作类型无效，支持的操作：disable（禁用）或 delete（删除）'
      });
    }

    console.log(`🔄 开始${action === 'disable' ? '禁用' : '删除'}授权码:`, license_key);

    // 查找授权码
    const existingLicense = await findLicenseByKey(license_key);

    if (!existingLicense) {
      return res.status(404).json({
        success: false,
        error: '授权码不存在'
      });
    }

    if (action === 'disable') {
      // 禁用授权码
      const updatedLicense = await updateLicense(license_key, {
        status: 'disabled',
        disabled_at: new Date().toISOString()
      });

      if (updatedLicense) {
        console.log('✅ 授权码禁用成功:', license_key);
        res.status(200).json({
          success: true,
          message: '授权码已成功禁用',
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
      // 删除授权码 - 这里我们实际上是标记为已删除，而不是真正删除
      const updatedLicense = await updateLicense(license_key, {
        status: 'deleted',
        disabled_at: new Date().toISOString()
      });

      if (updatedLicense) {
        console.log('✅ 授权码删除成功:', license_key);
        res.status(200).json({
          success: true,
          message: '授权码已成功删除',
          license: {
            license_key: updatedLicense.license_key,
            customer_name: updatedLicense.customer_name,
            status: updatedLicense.status,
            disabled_at: updatedLicense.disabled_at
          }
        });
      } else {
        throw new Error('删除授权码失败');
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
