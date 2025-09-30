/**
 * 兼容性修复脚本
 * 为旧客户端提供临时的无认证接口
 */

const express = require('express');
const router = express.Router();

// 临时无认证的授权验证接口（保持向后兼容）
router.post('/api/validate-license-legacy', (req, res) => {
  console.log('⚠️ 使用了遗留的无认证接口，建议升级客户端');

  // 这里可以调用原有的验证逻辑
  // 但建议客户端尽快升级到新的认证方式

  const { licenseKey } = req.body;

  if (!licenseKey) {
    return res.status(400).json({ error: '缺少授权码' });
  }

  // 简化的验证逻辑（实际应用中应该调用完整的验证流程）
  if (licenseKey === 'ADS-EXAMPLE123456789') {
    res.json({
      valid: true,
      license: {
        license_key: licenseKey,
        customer_name: '示例客户',
        expire_date: '2026-12-31T23:59:59.000Z',
        status: 'active'
      }
    });
  } else {
    res.json({
      valid: false,
      reason: '授权码无效'
    });
  }
});

// 获取临时访问令牌的简化接口
router.post('/api/get-temp-token', (req, res) => {
  const { clientId } = req.body;

  // 为旧客户端生成临时令牌
  const tempToken = Buffer.from(`temp_${clientId}_${Date.now()}`).toString('base64');

  res.json({
    success: true,
    tempToken,
    expires: Date.now() + 3600000, // 1小时后过期
    message: '这是临时令牌，请尽快升级到完整认证系统'
  });
});

module.exports = router;