// 简化的存储系统 - 使用Vercel支持的文件存储
const fs = require('fs');
const path = require('path');

const DATA_FILE = '/tmp/licenses.json';

// 确保数据文件存在
function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
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
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
      console.log('✅ 数据文件创建成功');
    }
  } catch (error) {
    console.error('❌ 创建数据文件失败:', error);
  }
}

// 读取数据
function readData() {
  try {
    ensureDataFile();
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ 读取数据失败:', error);
    return [];
  }
}

// 写入数据
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('✅ 数据写入成功，当前授权码数量:', data.length);
  } catch (error) {
    console.error('❌ 写入数据失败:', error);
    throw error;
  }
}

// 初始化存储
function initializeStorage() {
  try {
    ensureDataFile();
    const data = readData();
    console.log('✅ 存储初始化完成，当前授权码数量:', data.length);
    return true;
  } catch (error) {
    console.error('❌ 存储初始化失败:', error);
    return false;
  }
}

// 获取所有授权码
function getAllLicenses() {
  try {
    const licenses = readData();
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
function findLicenseByKey(licenseKey) {
  try {
    const licenses = readData();
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
function addLicense(licenseData) {
  try {
    const licenses = readData();
    const newId = licenses.length > 0 ? Math.max(...licenses.map(l => l.id)) + 1 : 1;
    
    const newLicense = {
      id: newId,
      ...licenseData,
      created_at: new Date().toISOString(),
      renewed_at: null,
      disabled_at: null
    };

    licenses.push(newLicense);
    writeData(licenses);
    
    console.log('✅ 授权码添加成功:', newLicense.license_key);
    return newLicense;
  } catch (error) {
    console.error('❌ 添加授权码失败:', error);
    throw error;
  }
}

// 更新授权码
function updateLicense(licenseKey, updateData) {
  try {
    const licenses = readData();
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

    writeData(licenses);
    console.log('✅ 授权码更新成功:', licenseKey);
    return licenses[index];
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
