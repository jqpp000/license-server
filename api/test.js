module.exports = function handler(req, res) {
  res.status(200).json({
    success: true,
    message: '测试API工作正常',
    timestamp: new Date().toISOString()
  });
};
