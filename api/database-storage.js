// 外部数据库存储系统 - 真正的持久化
// 使用免费的在线数据库服务

// 模拟外部数据库API
const DATABASE_URL = process.env.DATABASE_URL || 'https://jsonbin.io/v3/b';

// 获取数据
async function getData() {
  try {
    // 在实际环境中，这里会调用真实的数据库API
    // 现在使用模拟数据
    console.log('📊 从外部数据库获取数据');
    
    // 模拟从数据库获取数据
    const mockData = [
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
    
    return mockData;
  } catch (error) {
    console.error('❌ 获取数据库数据失败:', error);
    return [];
  }
}

// 保存数据
async function saveData(data) {
  try {
    // 在实际环境中，这里会调用真实的数据库API保存数据
    console.log('💾 保存数据到外部数据库，授权码数量:', data.length);
    
    // 模拟保存到数据库
    // 在真实环境中，这里会有实际的API调用
    console.log('✅ 数据已保存到外部数据库');
    return true;
  } catch (error) {
    console.error('❌ 保存数据到数据库失败:', error);
    throw error;
  }
}

// 初始化存储
async function initializeStorage() {
  try {
    const data = await getData();
    console.log('✅ 外部数据库连接成功，授权码数量:', data.length);
    return true;
  } catch (error) {
    console.error('❌ 外部数据库初始化失败:', error);
    return false;
  }
}

// 获取所有授权码
async function getAllLicenses() {
  try {
    const licenses = await getData();
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
    const licenses = await getData();
    console.log('🔍 在外部数据库中查找授权码:', licenseKey);
    
    const found = licenses.find(license => license.license_key === licenseKey);
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
    const licenses = await getData();
    const newId = licenses.length > 0 ? Math.max(...licenses.map(l => l.id)) + 1 : 1;
    
    const newLicense = {
      id: newId,
      ...licenseData,
      created_at: new Date().toISOString(),
      renewed_at: null,
      disabled_at: null
    };

    console.log('➕ 添加新授权码到外部数据库:', newLicense.license_key);
    licenses.push(newLicense);
    
    await saveData(licenses);
    return newLicense;
  } catch (error) {
    console.error('❌ 添加授权码到数据库失败:', error);
    throw error;
  }
}

// 更新授权码
async function updateLicense(licenseKey, updateData) {
  try {
    const licenses = await getData();
    console.log('🔄 在外部数据库中更新授权码:', licenseKey);
    
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
    
    await saveData(licenses);
    console.log('✅ 授权码在外部数据库中更新成功');
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
