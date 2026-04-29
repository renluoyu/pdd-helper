// api/index.js
// ✅ Vercel Serverless Function 入口文件（必须导出默认函数）
// ⚠️ 注意：Vercel 的 Edge Functions 不支持 localStorage，此处用内存变量模拟（仅限单实例测试）
// 生产环境请改用 Vercel KV 或数据库（如 Supabase）

// 初始化一个内存存储（⚠️ 重启后清空，仅用于演示）
let storage = [];

export default async function handler(req, res) {
  try {
    // 1. 解析请求方法和路径
    const { method } = req;
    const url = new URL(req.url, 'https://example.com'); // 构造完整 URL
    const path = url.pathname;

    // 2. 提取助力码：从路径末尾获取（如 /api/ABCDE）
    const code = path.split('/').filter(p => p).pop(); // 取最后一个非空段

    // 3. 处理 GET 请求（可选：用于调试）
    if (method === 'GET') {
      return res.status(200).json({
        message: 'PDD Helper API',
        total: storage.length,
        codes: storage.map(c => c.code)
      });
    }

    // 4. 处理 POST/PUT 请求（核心逻辑）
    if (method === 'POST' || method === 'PUT') {
      // 尝试解析 JSON body（Vercel 自动处理）
      let body = {};
      try {
        body = await req.json();
      } catch (e) {
        // 如果不是 JSON，尝试用 text()
        body = await req.text();
        if (body) {
          try {
            body = JSON.parse(body);
          } catch {}
        }
      }

      // 5. 检查是否已存在
      if (storage.some(c => c.code === code)) {
        return res.status(400).json({ error: '该助力码已存在' });
      }

      // 6. 添加新记录
      const newEntry = {
        code,
        date: new Date().toISOString(),
        used: Boolean(body.used || false),
        timestamp: Date.now()
      };
      storage.unshift(newEntry);

      // 7. 限制最多 20 条
      if (storage.length > 20) {
        storage.pop();
      }

      return res.status(200).json({ success: true, code: newEntry.code });
    }

    // 8. 其他方法返回 405
    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
