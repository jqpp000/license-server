// 内存存储系统 - 简化版本，适合演示和测试
// 注意：在Vercel Serverless环境中，这个存储会在函数重启时重置

// 全局内存存储
let licensesData = null;

// 获取初始数据
function getInitialData() {
  return [
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
}

// 获取数据
function getData() {
  if (!licensesData) {
    licensesData = getInitialData();
    console.log('✅ 内存存储初始化完成，授权码数量:', licensesData.length);
  }
  return licensesData;
}

// 保存数据
function saveData(data) {
  licensesData = data;
  console.log('✅ 数据已保存，当前授权码数量:', licensesData.length);
}

// 初始化存储
function initializeStorage() {
  getData();
  console.log('✅ 内存存储初始化完成');
  return true;
}

// 获取所有授权码
function getAllLicenses() {
  const licenses = getData();
  return licenses.map(license => ({
    ...license,
    is_expired: new Date() > new Date(license.expire_date)
  }));
}

// 根据授权码查找
function findLicenseByKey(licenseKey) {
  const licenses = getData();
  console.log('🔍 查找授权码:', licenseKey);
  console.log('📋 数据库中的授权码:', licenses.map(l => l.license_key));
  
  const found = licenses.find(license => license.license_key === licenseKey);
  console.log('✅ 查找结果:', found ? '找到' : '未找到');
  return found;
}

// 添加新授权码
function addLicense(licenseData) {
  const licenses = getData();
  const newId = licenses.length > 0 ? Math.max(...licenses.map(l => l.id)) + 1 : 1;
  
  const newLicense = {
    id: newId,
    ...licenseData,
    created_at: new Date().toISOString(),
    renewed_at: null,
    disabled_at: null
  };

  console.log('➕ 添加新授权码:', newLicense.license_key);
  licenses.push(newLicense);
  saveData(licenses);
  
  return newLicense;
}

// 更新授权码
function updateLicense(licenseKey, updateData) {
  const licenses = getData();
  console.log('🔄 更新授权码:', licenseKey);
  
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
  
  saveData(licenses);
  console.log('✅ 授权码更新成功');
  return licenses[index];
}

module.exports = {
  initializeStorage,
  getAllLicenses,
  findLicenseByKey,
  addLicense,
  updateLicense
};
