const AuthHandler = require('./auth-handler');

class AuthMiddleware {
  constructor() {
    this.authHandler = new AuthHandler();
    this.rateLimiter = new Map();
  }

  // JWT认证中间件
  authenticateToken() {
    return (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          error: '访问令牌缺失',
          code: 'MISSING_TOKEN'
        });
      }

      try {
        const user = this.authHandler.verifyToken(token);
        req.user = user;
        next();
      } catch (error) {
        return res.status(403).json({
          error: '令牌无效或已过期',
          code: 'INVALID_TOKEN'
        });
      }
    };
  }

  // 权限检查中间件
  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: '未认证',
          code: 'UNAUTHENTICATED'
        });
      }

      // 管理员拥有所有权限
      if (req.user.role === 'admin') {
        return next();
      }

      // 检查具体权限
      if (!req.user.permissions.includes(permission)) {
        return res.status(403).json({
          error: '权限不足',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permission
        });
      }

      next();
    };
  }

  // 角色检查中间件
  requireRole(role) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: '未认证',
          code: 'UNAUTHENTICATED'
        });
      }

      if (req.user.role !== role) {
        return res.status(403).json({
          error: '角色权限不足',
          code: 'INSUFFICIENT_ROLE',
          required: role,
          current: req.user.role
        });
      }

      next();
    };
  }

  // 频率限制中间件
  rateLimit(options = {}) {
    const {
      maxRequests = 100,
      windowMs = 15 * 60 * 1000, // 15分钟
      message = '请求过于频繁，请稍后重试'
    } = options;

    return (req, res, next) => {
      const clientId = this.getClientId(req);
      const now = Date.now();

      if (!this.rateLimiter.has(clientId)) {
        this.rateLimiter.set(clientId, {
          count: 1,
          resetTime: now + windowMs
        });
        return next();
      }

      const limit = this.rateLimiter.get(clientId);

      if (now > limit.resetTime) {
        limit.count = 1;
        limit.resetTime = now + windowMs;
        return next();
      }

      if (limit.count >= maxRequests) {
        return res.status(429).json({
          error: message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((limit.resetTime - now) / 1000)
        });
      }

      limit.count++;
      next();
    };
  }

  // 登录频率限制
  loginRateLimit() {
    return this.rateLimit({
      maxRequests: 5,
      windowMs: 15 * 60 * 1000, // 15分钟
      message: '登录尝试过于频繁，请15分钟后重试'
    });
  }

  // API频率限制
  apiRateLimit() {
    return this.rateLimit({
      maxRequests: 1000,
      windowMs: 60 * 60 * 1000, // 1小时
      message: 'API调用频率超限，请稍后重试'
    });
  }

  // 获取客户端标识
  getClientId(req) {
    // 优先使用用户ID，其次使用IP
    if (req.user && req.user.userId) {
      return `user_${req.user.userId}`;
    }

    // 获取真实IP地址
    const ip = req.headers['x-forwarded-for'] ||
               req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               req.ip;

    return `ip_${ip}`;
  }

  // 请求日志中间件
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      const originalSend = res.send;

      res.send = function(data) {
        const duration = Date.now() - start;

        // 记录请求日志
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.user ? req.user.username : 'anonymous'}`);

        originalSend.call(this, data);
      };

      next();
    };
  }

  // 安全头中间件
  securityHeaders() {
    return (req, res, next) => {
      // 基本安全头
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

      // CSP头
      res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data:; " +
        "connect-src 'self';"
      );

      next();
    };
  }

  // CORS中间件
  corsHandler() {
    return (req, res, next) => {
      const allowedOrigins = [
        'http://localhost:3003',
        'http://localhost:3000',
        'https://your-domain.com'
      ];

      const origin = req.headers.origin;
      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }

      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24小时

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    };
  }

  // 输入验证中间件
  validateInput(schema) {
    return (req, res, next) => {
      const { error } = schema.validate(req.body);

      if (error) {
        return res.status(400).json({
          error: '输入数据验证失败',
          code: 'VALIDATION_ERROR',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      next();
    };
  }

  // 清理过期的限流记录
  cleanupRateLimit() {
    const now = Date.now();

    for (const [clientId, limit] of this.rateLimiter.entries()) {
      if (now > limit.resetTime) {
        this.rateLimiter.delete(clientId);
      }
    }
  }

  // 定期清理（建议在应用启动时调用）
  startCleanupSchedule() {
    setInterval(() => {
      this.cleanupRateLimit();
    }, 5 * 60 * 1000); // 每5分钟清理一次
  }
}

module.exports = AuthMiddleware;