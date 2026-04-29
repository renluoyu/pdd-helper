// api/index.js
let storage = [];

export default async function handler(req, res) {
  try {
    const { method } = req;
    const url = new URL(req.url, 'https://example.com');
    const code = url.pathname.split('/').filter(p => p).pop();

    if (!code) {
      return res.status(400).json({ error: 'Missing code in path' });
    }

    if (method === 'POST' || method === 'PUT') {
      // 检查重复
      if (storage.some(c => c.code === code)) {
        return res.status(400).json({ error: '该助力码已存在' });
      }

      storage.unshift({
        code,
        timestamp: Date.now(),
        used: false
      });

      // 限制20条
      if (storage.length > 20) storage.pop();

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
