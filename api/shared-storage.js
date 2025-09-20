// 共享存储 - 使用文件系统持久化数据
const fs = require('fs');
const path = require('path');

const DATA_FILE = '/tmp/licenses.json';

// 初始化数据存储
function initializeStorage() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return;
    }
    
    const initialData = [
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
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
  } catch (error) {
    console.error('初始化存储失败:', error);
  }
}

// 读取数据
function readData() {
  try {
    initializeStorage();
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('读取数据失败:', error);
    return [];
  }
}

// 写入数据
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('写入数据失败:', error);
  }
}

// 获取所有授权码
function getAllLicenses() {
  const licensesData = readData();
  return licensesData.map(license => ({
    ...license,
    features: JSON.parse(license.features || '{}'),
    is_expired: new Date() > new Date(license.expire_date)
  }));
}

// 根据授权码查找
function findLicenseByKey(licenseKey) {
  const licensesData = readData();
  return licensesData.find(license => license.license_key === licenseKey);
}

// 添加新授权码
function addLicense(licenseData) {
  const licensesData = readData();
  const newId = licensesData.length > 0 ? Math.max(...licensesData.map(l => l.id)) + 1 : 1;
  const newLicense = {
    id: newId,
    ...licenseData,
    features: JSON.stringify(licenseData.features || {}),
    created_at: new Date().toISOString(),
    renewed_at: null,
    disabled_at: null
  };
  
  licensesData.push(newLicense);
  writeData(licensesData);
  return newLicense;
}

// 更新授权码
function updateLicense(licenseKey, updateData) {
  const licensesData = readData();
  const index = licensesData.findIndex(license => license.license_key === licenseKey);
  if (index !== -1) {
    licensesData[index] = {
      ...licensesData[index],
      ...updateData,
      renewed_at: new Date().toISOString()
    };
    writeData(licensesData);
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
