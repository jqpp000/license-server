const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const fs = require('fs');
const path = require('path');

class AuthHandler {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'ads-license-system-super-secret-key-2024';
    this.tokenExpiry = '8h';
    this.usersFile = path.join(__dirname, '..', 'data', 'users.json');
    this.initializeUsers();
  }

  // 初始化默认用户
  async initializeUsers() {
    if (!fs.existsSync(this.usersFile)) {
      const defaultUsers = [
        {
          id: 1,
          username: 'admin',
          passwordHash: await bcrypt.hash('admin123', 12),
          role: 'admin',
          active: true,
          twoFactorEnabled: false,
          totpSecret: null,
          permissions: ['read', 'write', 'delete', 'manage_users', 'manage_licenses'],
          createdAt: new Date().toISOString(),
          lastLogin: null
        },
        {
          id: 2,
          username: 'operator',
          passwordHash: await bcrypt.hash('operator123', 12),
          role: 'operator',
          active: true,
          twoFactorEnabled: false,
          totpSecret: null,
          permissions: ['read', 'write'],
          createdAt: new Date().toISOString(),
          lastLogin: null
        }
      ];

      // 确保data目录存在
      const dataDir = path.dirname(this.usersFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(this.usersFile, JSON.stringify(defaultUsers, null, 2));
    }
  }

  // 获取所有用户
  getUsers() {
    try {
      const data = fs.readFileSync(this.usersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('读取用户文件失败:', error);
      return [];
    }
  }

  // 保存用户数据
  saveUsers(users) {
    try {
      fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
      return true;
    } catch (error) {
      console.error('保存用户文件失败:', error);
      return false;
    }
  }

  // 根据用户名查找用户
  findUserByUsername(username) {
    const users = this.getUsers();
    return users.find(user => user.username === username);
  }

  // 验证用户凭证
  async validateCredentials(username, password) {
    const user = this.findUserByUsername(username);
    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  // 主要认证方法
  async authenticate(username, password, totpToken = null) {
    try {
      // 1. 验证用户名密码
      const user = await this.validateCredentials(username, password);
      if (!user) {
        throw new Error('用户名或密码错误');
      }

      // 2. 检查账户状态
      if (!user.active) {
        throw new Error('账户已被禁用');
      }

      // 3. 验证双因子认证
      if (user.twoFactorEnabled) {
        if (!totpToken) {
          throw new Error('需要双因子认证码');
        }

        const isValidTotp = speakeasy.totp.verify({
          secret: user.totpSecret,
          encoding: 'base32',
          token: totpToken,
          window: 2
        });

        if (!isValidTotp) {
          throw new Error('双因子认证码无效');
        }
      }

      // 4. 生成JWT令牌
      const token = jwt.sign({
        userId: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      }, this.jwtSecret, { expiresIn: this.tokenExpiry });

      // 5. 更新最后登录时间
      await this.updateLastLogin(user.id);

      // 6. 记录登录日志
      await this.logLoginAttempt(user.username, true, 'success');

      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          permissions: user.permissions
        }
      };

    } catch (error) {
      // 记录失败的登录尝试
      await this.logLoginAttempt(username, false, error.message);
      throw error;
    }
  }

  // 验证JWT令牌
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);

      // 检查用户是否仍然存在且活跃
      const user = this.findUserByUsername(decoded.username);
      if (!user || !user.active) {
        throw new Error('用户不存在或已被禁用');
      }

      return decoded;
    } catch (error) {
      throw new Error('令牌无效或已过期');
    }
  }

  // 设置双因子认证
  async setupTwoFactor(userId) {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);

    if (userIndex === -1) {
      throw new Error('用户不存在');
    }

    const secret = speakeasy.generateSecret({
      name: '广告管理系统',
      account: users[userIndex].username,
      length: 32
    });

    // 生成QR码数据
    const qrCodeUrl = secret.otpauth_url;

    // 暂时保存密钥（用户确认后才正式启用）
    users[userIndex].totpSecretTemp = secret.base32;
    this.saveUsers(users);

    return {
      secret: secret.base32,
      qrCodeUrl,
      manualEntryKey: secret.base32
    };
  }

  // 确认并启用双因子认证
  async enableTwoFactor(userId, verificationCode) {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);

    if (userIndex === -1) {
      throw new Error('用户不存在');
    }

    const user = users[userIndex];
    if (!user.totpSecretTemp) {
      throw new Error('未找到临时密钥，请重新设置');
    }

    // 验证提供的代码
    const isValid = speakeasy.totp.verify({
      secret: user.totpSecretTemp,
      encoding: 'base32',
      token: verificationCode,
      window: 2
    });

    if (!isValid) {
      throw new Error('验证码无效');
    }

    // 启用双因子认证
    users[userIndex].twoFactorEnabled = true;
    users[userIndex].totpSecret = user.totpSecretTemp;
    delete users[userIndex].totpSecretTemp;

    this.saveUsers(users);

    return { success: true, message: '双因子认证已启用' };
  }

  // 禁用双因子认证
  async disableTwoFactor(userId) {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);

    if (userIndex === -1) {
      throw new Error('用户不存在');
    }

    users[userIndex].twoFactorEnabled = false;
    users[userIndex].totpSecret = null;
    delete users[userIndex].totpSecretTemp;

    this.saveUsers(users);

    return { success: true, message: '双因子认证已禁用' };
  }

  // 更新最后登录时间
  async updateLastLogin(userId) {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);

    if (userIndex !== -1) {
      users[userIndex].lastLogin = new Date().toISOString();
      this.saveUsers(users);
    }
  }

  // 记录登录尝试
  async logLoginAttempt(username, success, message = '') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      username,
      success,
      message,
      ip: 'unknown' // 在实际应用中应该获取真实IP
    };

    const logFile = path.join(__dirname, '..', 'data', 'auth-logs.json');
    let logs = [];

    try {
      if (fs.existsSync(logFile)) {
        const data = fs.readFileSync(logFile, 'utf8');
        logs = JSON.parse(data);
      }
    } catch (error) {
      console.error('读取认证日志失败:', error);
    }

    logs.push(logEntry);

    // 只保留最近1000条记录
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }

    try {
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error('保存认证日志失败:', error);
    }
  }

  // 修改密码
  async changePassword(userId, oldPassword, newPassword) {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);

    if (userIndex === -1) {
      throw new Error('用户不存在');
    }

    const user = users[userIndex];

    // 验证旧密码
    const isValidOldPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValidOldPassword) {
      throw new Error('当前密码错误');
    }

    // 密码强度检查
    if (newPassword.length < 8) {
      throw new Error('新密码长度至少8位');
    }

    // 加密新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    users[userIndex].passwordHash = newPasswordHash;

    this.saveUsers(users);

    return { success: true, message: '密码修改成功' };
  }

  // 获取认证日志
  getAuthLogs(limit = 100) {
    const logFile = path.join(__dirname, '..', 'data', 'auth-logs.json');

    try {
      if (fs.existsSync(logFile)) {
        const data = fs.readFileSync(logFile, 'utf8');
        const logs = JSON.parse(data);
        return logs.slice(-limit).reverse();
      }
    } catch (error) {
      console.error('读取认证日志失败:', error);
    }

    return [];
  }
}

module.exports = AuthHandler;