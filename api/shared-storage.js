// 共享内存存储 - 用于Vercel Serverless环境
// 注意：这只在单个函数实例的生命周期内有效

let licensesData = null;
let isInitialized = false;

// 初始化数据存储
function initializeStorage() {
  if (!isInitialized) {
    licensesData = [
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
    isInitialized = true;
  }
  return licensesData;
}

// 获取所有授权码
function getAllLicenses() {
  initializeStorage();
  return licensesData.map(license => ({
    ...license,
    features: JSON.parse(license.features || '{}'),
    is_expired: new Date() > new Date(license.expire_date)
  }));
}

// 根据授权码查找
function findLicenseByKey(licenseKey) {
  initializeStorage();
  return licensesData.find(license => license.license_key === licenseKey);
}

// 添加新授权码
function addLicense(licenseData) {
  initializeStorage();
  const newId = Math.max(...licensesData.map(l => l.id)) + 1;
  const newLicense = {
    id: newId,
    ...licenseData,
    features: JSON.stringify(licenseData.features || {}),
    created_at: new Date().toISOString(),
    renewed_at: null,
    disabled_at: null
  };
  licensesData.push(newLicense);
  return newLicense;
}

// 更新授权码
function updateLicense(licenseKey, updateData) {
  initializeStorage();
  const index = licensesData.findIndex(license => license.license_key === licenseKey);
  if (index !== -1) {
    licensesData[index] = {
      ...licensesData[index],
      ...updateData,
      renewed_at: new Date().toISOString()
    };
    return licensesData[index];
  }
  return null;
}

module.exports = {
  initializeStorage,
  getAllLicenses,
  findLicenseByKey,
  addLicense,
  updateLicense
};
