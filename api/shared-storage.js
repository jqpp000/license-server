// 全局数据存储 - 简化版本
// 在Vercel环境中，我们使用一个更简单的方法

let globalLicensesData = null;

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
      features: '{"ads_management": true, "user_management": true, "reports": true, "api_access": true}',
      created_at: new Date().toISOString(),
      renewed_at: null,
      disabled_at: null
    }
  ];
}

// 获取数据（带调试信息）
function getData() {
  if (!globalLicensesData) {
    globalLicensesData = getInitialData();
    console.log('🔧 初始化数据存储，当前授权码数量:', globalLicensesData.length);
    console.log('📋 示例授权码:', globalLicensesData[0].license_key);
  }
  console.log('📊 当前数据状态:', {
    totalLicenses: globalLicensesData.length,
    licenseKeys: globalLicensesData.map(l => l.license_key)
  });
  return globalLicensesData;
}

// 保存数据（带调试信息）
function saveData(data) {
  globalLicensesData = data;
  console.log('💾 数据已保存，当前授权码数量:', globalLicensesData.length);
  console.log('🔑 最新授权码:', globalLicensesData.map(l => l.license_key));
}

// 获取所有授权码
function getAllLicenses() {
  const licensesData = getData();
  return licensesData.map(license => ({
    ...license,
    features: JSON.parse(license.features || '{}'),
    is_expired: new Date() > new Date(license.expire_date)
  }));
}

// 根据授权码查找
function findLicenseByKey(licenseKey) {
  const licensesData = getData();
  console.log('🔍 查找授权码:', licenseKey);
  console.log('📋 可用的授权码:', licensesData.map(l => l.license_key));
  
  const found = licensesData.find(license => license.license_key === licenseKey);
  console.log('✅ 查找结果:', found ? '找到' : '未找到');
  return found;
}

// 添加新授权码
function addLicense(licenseData) {
  const licensesData = getData();
  const newId = licensesData.length > 0 ? Math.max(...licensesData.map(l => l.id)) + 1 : 1;
  const newLicense = {
    id: newId,
    ...licenseData,
    features: JSON.stringify(licenseData.features || {}),
    created_at: new Date().toISOString(),
    renewed_at: null,
    disabled_at: null
  };
  
  console.log('➕ 添加新授权码:', newLicense.license_key);
  licensesData.push(newLicense);
  saveData(licensesData);
  return newLicense;
}

// 更新授权码
function updateLicense(licenseKey, updateData) {
  const licensesData = getData();
  console.log('🔄 更新授权码:', licenseKey);
  const index = licensesData.findIndex(license => license.license_key === licenseKey);
  
  if (index !== -1) {
    licensesData[index] = {
      ...licensesData[index],
      ...updateData,
      renewed_at: new Date().toISOString()
    };
    saveData(licensesData);
    console.log('✅ 授权码更新成功');
    return licensesData[index];
  }
  
  console.log('❌ 授权码未找到，无法更新');
  return null;
}

module.exports = {
  initializeStorage,
  getAllLicenses,
  findLicenseByKey,
  addLicense,
  updateLicense
};
