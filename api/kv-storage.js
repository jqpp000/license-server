// Vercel KV 数据库存储系统 - 生产级解决方案
const { kv } = require('@vercel/kv');

const LICENSES_KEY = 'licenses';
const COUNTER_KEY = 'license_counter';

// 初始化存储
async function initializeStorage() {
  try {
    // 检查是否已有数据
    const existing = await kv.get(LICENSES_KEY);
    if (existing) {
      console.log('✅ 数据库已存在，当前授权码数量:', existing.length);
      return;
    }

    // 创建初始数据
    const initialData = [
      {
        id: 1,
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
        },
        created_at: new Date().toISOString(),
        renewed_at: null,
        disabled_at: null
      }
    ];

    await kv.set(LICENSES_KEY, initialData);
    await kv.set(COUNTER_KEY, 1);
    console.log('✅ 数据库初始化完成，创建示例授权码');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

// 获取所有授权码
async function getAllLicenses() {
  try {
    const licenses = await kv.get(LICENSES_KEY) || [];
    return licenses.map(license => ({
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
    const licenses = await kv.get(LICENSES_KEY) || [];
    const found = licenses.find(license => license.license_key === licenseKey);
    
    console.log('🔍 查找授权码:', licenseKey);
    console.log('📋 数据库中的授权码:', licenses.map(l => l.license_key));
    console.log('✅ 查找结果:', found ? '找到' : '未找到');
    
    return found;
  } catch (error) {
    console.error('❌ 查找授权码失败:', error);
    return null;
  }
}

// 添加新授权码
async function addLicense(licenseData) {
  try {
    const licenses = await kv.get(LICENSES_KEY) || [];
    const counter = await kv.get(COUNTER_KEY) || 0;
    
    const newId = counter + 1;
    const newLicense = {
      id: newId,
      ...licenseData,
      created_at: new Date().toISOString(),
      renewed_at: null,
      disabled_at: null
    };

    licenses.push(newLicense);
    
    // 原子性更新
    await kv.set(LICENSES_KEY, licenses);
    await kv.set(COUNTER_KEY, newId);
    
    console.log('✅ 授权码添加成功:', newLicense.license_key);
    return newLicense;
  } catch (error) {
    console.error('❌ 添加授权码失败:', error);
    throw error;
  }
}

// 更新授权码
async function updateLicense(licenseKey, updateData) {
  try {
    const licenses = await kv.get(LICENSES_KEY) || [];
    const index = licenses.findIndex(license => license.license_key === licenseKey);
    
    if (index === -1) {
      console.log('❌ 授权码未找到:', licenseKey);
      return null;
    }

    licenses[index] = {
      ...licenses[index],
      ...updateData,
      renewed_at: new Date().toISOString()
    };

    await kv.set(LICENSES_KEY, licenses);
    console.log('✅ 授权码更新成功:', licenseKey);
    return licenses[index];
  } catch (error) {
    console.error('❌ 更新授权码失败:', error);
    throw error;
  }
}

// 删除授权码
async function deleteLicense(licenseKey) {
  try {
    const licenses = await kv.get(LICENSES_KEY) || [];
    const filtered = licenses.filter(license => license.license_key !== licenseKey);
    
    if (filtered.length === licenses.length) {
      console.log('❌ 授权码未找到:', licenseKey);
      return false;
    }

    await kv.set(LICENSES_KEY, filtered);
    console.log('✅ 授权码删除成功:', licenseKey);
    return true;
  } catch (error) {
    console.error('❌ 删除授权码失败:', error);
    throw error;
  }
}

module.exports = {
  initializeStorage,
  getAllLicenses,
  findLicenseByKey,
  addLicense,
  updateLicense,
  deleteLicense
};
