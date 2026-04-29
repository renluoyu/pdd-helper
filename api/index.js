import cors from 'cors';

// 内存存储助力码（重启后清空，生产环境建议用数据库）
let storage = [];

export default async function handler(req, res) {
  // 设置 CORS 头部
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;

  // 解析路径参数
  const url = new URL(req.url, `https://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(p => p);
  const code = pathParts[0]; // 获取路径中的第一个参数作为助力码

  try {
    if (method === 'POST' || method === 'PUT') {
      // 添加新助力码
      if (!code) {
        return res.status(400).json({ 
          error: 'Missing code in path',
          usage: 'POST /your-code-here'
        });
      }

      // 检查重复
      if (storage.some(item => item.code === code)) {
        return res.status(400).json({ 
          error: '该助力码已存在',
          code: code
        });
      }

      // 添加到数组开头
      storage.unshift({
        code: code,
        timestamp: Date.now(),
        used: false
      });

      // 限制最多20条记录
      if (storage.length > 20) {
        storage = storage.slice(0, 20);
      }

      return res.status(200).json({ 
        success: true,
        message: '助力码已添加',
        code: code,
        total: storage.length
      });

    } else if (method === 'GET') {
      // 获取所有助力码
      if (code) {
        // 查询特定助力码
        const found = storage.find(item => item.code === code);
        if (!found) {
          return res.status(404).json({ error: '助力码不存在', code: code });
        }
        return res.status(200).json(found);
      } else {
        // 返回所有助力码
        return res.status(200).json({
          count: storage.length,
          codes: storage.map(item => ({
            code: item.code,
            timestamp: item.timestamp,
            used: item.used
          }))
        });
      }
    } else if (method === 'DELETE') {
      // 删除助力码
      if (!code) {
        return res.status(400).json({ error: 'Missing code in path' });
      }

      const initialLength = storage.length;
      storage = storage.filter(item => item.code !== code);
      
      if (storage.length === initialLength) {
        return res.status(404).json({ error: '助力码不存在', code: code });
      }

      return res.status(200).json({ 
        success: true, 
        message: '助力码已删除',
        deletedCode: code 
      });
    } else {
      // 其他方法
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// 如果使用 CommonJS
// module.exports = handler;
