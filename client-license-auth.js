const fs = require('fs');
const path = require('path');

// 加载本地授权码列表（备用）
function loadLicenses() {
  try {
    const licensesPath = path.join(__dirname, '../config/licenses.json');
    const data = fs.readFileSync(licensesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { licenses: [] };
  }
}

// 本地验证授权码（备用）
function validateLicenseLocal(licenseKey) {
  if (!licenseKey) return false;
  
  const { licenses } = loadLicenses();
  const license = licenses.find(l => l.license_key === licenseKey);
  
  if (!license) return false;
  if (license.status !== 'active') return false;
  if (new Date() > new Date(license.expire_date)) return false;
  
  return true;
}

// 在线验证授权码
async function validateLicenseOnline(licenseKey) {
  try {
    const response = await fetch('https://your-vercel-app.vercel.app/api/validate-license', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey })
    });
    
    if (!response.ok) {
      throw new Error('网络请求失败');
    }
    
    const result = await response.json();
    return result.valid;
  } catch (error) {
    console.log('⚠️ 在线验证失败，使用本地验证:', error.message);
    return false;
  }
}

// 混合验证授权码
async function validateLicense(licenseKey) {
  // 1. 先尝试在线验证
  try {
    const onlineResult = await validateLicenseOnline(licenseKey);
    if (onlineResult) {
      console.log('✅ 在线验证成功');
      return true;
    }
  } catch (error) {
    console.log('⚠️ 在线验证失败，尝试本地验证');
  }
  
  // 2. 在线验证失败时使用本地验证
  const localResult = validateLicenseLocal(licenseKey);
  if (localResult) {
    console.log('✅ 本地验证成功（离线模式）');
    return true;
  }
  
  console.log('❌ 授权码验证失败');
  return false;
}

// 启动时强制验证
async function startupLicenseCheck() {
  const licenseKey = process.env.LICENSE_KEY;
  
  if (!licenseKey) {
    console.error('❌ 缺少授权码，程序无法启动');
    console.error('请设置 LICENSE_KEY 环境变量');
    console.error('例如: set LICENSE_KEY=ADS-ABC123DEF456GHI789');
    process.exit(1);
  }
  
  const isValid = await validateLicense(licenseKey);
  if (!isValid) {
    console.error('❌ 授权码无效或已过期，程序无法启动');
    console.error('请联系管理员获取有效授权码');
    process.exit(1);
  }
  
  console.log('✅ 授权验证成功，程序启动');
}

module.exports = { validateLicense, startupLicenseCheck };
